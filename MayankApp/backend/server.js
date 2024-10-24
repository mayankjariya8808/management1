const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const methodOverride = require("method-override");
const dns = require('dns');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Initialize the Express App
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(methodOverride("_method"));

require("dotenv").config();

const port = process.env.PORT || 3000; // Use the PORT from environment variables
const mongoUrl = process.env.MONGO_URL || 'your-atlas-connection-url'; // MongoDB Atlas connection URL

dns.setServers(['8.8.8.8', '1.1.1.1']); // Set to Google or Cloudflare DNS

// MongoDB Connection
mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("connected", (err) => {
    if (err) {
        console.log("DB not connected");
    } else {
        console.log("DB connected");
    }
});

// Define Workspace Schema and Model
const WorkspaceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    totalExpenses: { type: Number, default: 0 },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
    date: { type: Date, default: Date.now }
});

const Workspace = mongoose.model('Workspace', WorkspaceSchema);

// Define Member Schema and Model
const MemberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contactNumber: { type: String, required: true },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
    totalExpenses: { type: Number, default: 0 },
    date: { type: Date, default: Date.now }
});

const Member = mongoose.model('Member', MemberSchema);

// Define Expense Schema and Model
const ExpenseSchema = new mongoose.Schema({
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    date: { type: Date, default: Date.now }
});

const Expense = mongoose.model('Expense', ExpenseSchema);




// Define User Schema and Model
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
});

const User = mongoose.model('User', UserSchema);

// Signup Route
app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        // Hash the password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ message: 'Error during signup' });
    }
});

// Forgot Password Route - Sends a reset token
app.post('/api/forgotpassword', async (req, res) => {
    const { username } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate a password reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour

        await user.save();

        // Send the reset token to the user (In real implementation, you would email the token)
        res.status(200).json({ message: 'Password reset token sent', token: resetToken });
    } catch (error) {
        console.error('Error generating reset token:', error);
        res.status(500).json({ message: 'Error processing forgot password' });
    }
});

// Reset Password Route - Uses the token to reset the password
app.post('/api/resetpassword', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() } // Ensure token hasn't expired
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the password and remove the reset token
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Error resetting password' });
    }
});

// Login Route
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find the user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid username' });
        }

        // Compare the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        res.json({ success: true, userId: user._id });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Routes
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Add Workspace (POST Request)
app.post('/api/workspaces', async (req, res) => {
    const { name, amount, date } = req.body; // Include date in the request
    try {
        const newWorkspace = new Workspace({ name, amount, date }); // Add date to the newWorkspace
        await newWorkspace.save();
        res.status(201).json(newWorkspace);
    } catch (error) {
        res.status(500).json({ error: 'Error adding workspace' });
    }
});

// Get All Workspaces (GET Request)
app.get('/api/workspaces', async (req, res) => {
    try {
        const workspaces = await Workspace.find().populate('members'); // Populate members
        res.json(workspaces);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching workspaces' });
    }
});

// Add Member to Workspace (POST Request)
app.post('/api/members', async (req, res) => {
    const { name, contactNumber, workspaceId, date } = req.body; // Include date in the request

    try {
        const newMember = new Member({ name, contactNumber, workspaceId, date }); // Add date to the newMember
        const savedMember = await newMember.save();
        
        // Update the workspace with the new member's ID
        await Workspace.findByIdAndUpdate(workspaceId, { $push: { members: savedMember._id } });
        
        res.status(201).json(savedMember);
    } catch (error) {
        res.status(500).json({ error: 'Error adding member' });
    }
});

// Get Members for a Workspace (GET Request)
app.get('/api/workspaces/:id/members', async (req, res) => {
    try {
        const members = await Member.find({ workspaceId: req.params.id });
        res.json(members);
    } catch (error) {
        console.error('Error fetching members:', error); // Log error on the server
        res.status(500).json({ error: 'Error fetching members' });
    }
});

// Add Expense for a Member (POST Request)
app.post('/api/members/:memberId/expenses', async (req, res) => {
    const { description, amount, date } = req.body; // Include date in the request
    const { memberId } = req.params;

    try {
        const newExpense = new Expense({
            description,
            amount,
            memberId,
            date: date || Date.now() // Use provided date or default to current date
        });
        await newExpense.save();

        // Update the workspace's total expenses
        const member = await Member.findById(memberId).populate('workspaceId');
        if (member && member.workspaceId) {
            await Workspace.findByIdAndUpdate(member.workspaceId._id, { $inc: { totalExpenses: amount } });
        }

        res.status(201).json(newExpense);
    } catch (error) {
        res.status(500).json({ error: 'Error adding expense' });
    }
});

// Get Expenses for a Member (GET Request)
app.get('/api/members/:memberId/expenses', async (req, res) => {
    try {
        const expenses = await Expense.find({ memberId: req.params.memberId });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching expenses' });
    }
});

// Delete Expense (DELETE Request)
app.delete('/api/expenses/:id', async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        // Update the workspace's total expenses
        const member = await Member.findById(expense.memberId).populate('workspaceId');
        if (member && member.workspaceId) {
            await Workspace.findByIdAndUpdate(member.workspaceId._id, { $inc: { totalExpenses: -expense.amount } });
        }

        await Expense.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Expense deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting expense' });
    }
});

// Update total expense for a member (PUT Request)
app.put('/api/members/:memberId/total-expense', async (req, res) => {
    const { memberId } = req.params;
    const { totalExpense } = req.body;

    try {
        const updatedMember = await Member.findByIdAndUpdate(memberId, { totalExpenses: totalExpense }, { new: true });
        if (!updatedMember) {
            return res.status(404).json({ error: 'Member not found' });
        }
        res.status(200).json(updatedMember);
    } catch (error) {
        res.status(500).json({ error: 'Error updating total expense' });
    }
});

// Delete Workspace (DELETE Request)
app.delete('/api/workspaces/:id', async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        // Remove all members associated with the workspace
        await Member.deleteMany({ workspaceId: req.params.id });

        // Remove all expenses associated with the workspace's members
        await Expense.deleteMany({ memberId: { $in: workspace.members } });

        await Workspace.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Workspace deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting workspace' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
