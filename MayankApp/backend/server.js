const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const methodOverride = require("method-override");
const dns = require('dns');

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
    totalExpenses: { type: Number, default: 0 }, // Add this line
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],  // Reference to members
    date: { type: Date, default: Date.now }  // Add the date field
});

const Workspace = mongoose.model('Workspace', WorkspaceSchema);

// Define Member Schema and Model
const MemberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contactNumber: { type: String, required: true },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },  // Reference to the workspace
    totalExpenses: { type: Number, default: 0 }, // Add totalExpenses to Member schema
    date: { type: Date, default: Date.now }  // Add the date field
});

const Member = mongoose.model('Member', MemberSchema);

// Define Expense Schema and Model
const ExpenseSchema = new mongoose.Schema({
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    date: { type: Date, default: Date.now }  // Add the date field
});

const Expense = mongoose.model('Expense', ExpenseSchema);

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
