import { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, Button, Modal, TextField, useMediaQuery, useTheme,IconButton } from '@mui/material';
import { Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import axios from 'axios';
import DeleteIcon from '@mui/icons-material/Delete';

import { useNavigate } from 'react-router-dom';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const Dashboard = () => {

    const [openModal, setOpenModal] = useState(false);
    const [workspaces, setWorkspaces] = useState([]);
    const [workspaceName, setWorkspaceName] = useState('');
    const [workspaceAmount, setWorkspaceAmount] = useState('');
    const [date, setDate] = useState(''); // Added state for date
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        const fetchWorkspaces = async () => {
            try {
                const res = await axios.get('https://managementfinal-1.onrender.com/api/workspaces');
                setWorkspaces(res.data);
                // Assuming the date is stored in the 'date' field of each workspace object
                // and we want to display the date of the first workspace as a placeholder
                if (res.data.length > 0) {
                    setDate(res.data[0].date);
                }
            } catch (error) {
                console.error('Error fetching workspaces', error);
            }
        };

        fetchWorkspaces();
    }, []);

    const handleOpenModal = () => setOpenModal(true);
    const handleCloseModal = () => setOpenModal(false);

    const handleAddWorkspace = async () => {
        if (workspaceName && workspaceAmount > 0 && date) { // Added date to the condition
            const newWorkspace = {
                name: workspaceName,
                amount: parseFloat(workspaceAmount),
                date: date, // Added date to the newWorkspace object
            };

            try {
                const res = await axios.post('https://managementfinal-1.onrender.com/api/workspaces', newWorkspace);
                setWorkspaces([...workspaces, res.data]);
                setWorkspaceName('');
                setWorkspaceAmount('');
                setDate(''); // Reset date state after adding workspace
                handleCloseModal();
            } catch (error) {
                console.error('Error adding workspace', error);
            }
        }
    };

    const handleLogout = () => {
        // Clear login status from localStorage and navigate to login page
        localStorage.removeItem('isLoggedIn');
        navigate('/login');
    };

    // Dynamically set data for the charts based on workspaces
    const lineChartData = {
        labels: workspaces.map((workspace) => workspace.name),
        datasets: [{
            label: 'Total Expenses',
            data: workspaces.map((workspace) => workspace.totalExpenses || 0),
            borderColor: '#36A2EB',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            fill: true,
        }],
    };

    const doughnutChartData = {
        labels: workspaces.map((workspace) => workspace.name),
        datasets: [{
            data: workspaces.map((workspace) => workspace.amount),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#F7464A'],
        }],
    };

    const handleDeleteWorkspace = async (event, id) => {
        event.stopPropagation(); // Prevent the click event from bubbling up
        try {
            await axios.delete(`https://managementfinal-1.onrender.com/api/workspaces/${id}`);
            const updatedWorkspaces = workspaces.filter(workspace => workspace._id !== id);
            setWorkspaces(updatedWorkspaces);
        } catch (error) {
            console.error('Error deleting workspace', error);
        }
    };
    

    return (
        <Box sx={{ padding: isMobile ? 2 : 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
                    Expense Dashboard
                </Typography>
                <Button variant="outlined" color="secondary" onClick={handleLogout}>
                    Logout
                </Button>
            </Box>

            <Grid container spacing={isMobile ? 2 : 4}>
                <Grid item xs={12} md={6}>
                    <Paper elevation={3} sx={{ padding: isMobile ? 2 : 3 }}>
                        <Typography variant="h6">Monthly Expenses</Typography>
                        <Line data={lineChartData} options={{ responsive: true }} />
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper elevation={3} sx={{ padding: isMobile ? 2 : 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="h6">Category-wise Breakdown</Typography>
                        <Box sx={{ width: '100%', maxWidth: '300px' }}>
                            <Doughnut data={doughnutChartData} options={{ responsive: true }} />
                        </Box>
                    </Paper>
                </Grid>

                {workspaces.map((workspace, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={workspace._id}>
                        <Paper 
                            elevation={3} 
                            sx={{ 
                                padding: 2,
                                cursor: 'pointer',
                                backgroundColor: index % 2 === 0 ? '#f0f8ff' : '#fff0f5', 
                                '&:hover': {
                                    backgroundColor: '#e6e6fa', 
                                },
                                display: 'flex',
                                flexDirection: 'column',
                                // alignItems: 'center',
                                // textAlign: 'center',
                                borderRadius: 2, // Added for a more modern look
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Added for a subtle shadow
                                gap: 2, // Added for spacing between elements
                            }} 
                            onClick={() => navigate(`/workspace/${workspace._id}`)}
                        >
                            <Box sx={{ textAlign: 'right' ,display:'flex',justifyContent:"space-between" }}>
                                
                            <Typography variant="h6" sx={{ color: '#4b0082', marginBottom: 1, fontWeight: 'bold', fontSize: '1.5rem' }}>{workspace.name}</Typography>
                            <IconButton aria-label="delete" onClick={(event) => handleDeleteWorkspace(event, workspace._id)}>
    <DeleteIcon />
</IconButton>

                            </Box>
                            

                            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 1, gap: 1 }}>
 
                                <Typography variant="body2" sx={{ color: '#008000', marginBottom: 0.5, fontWeight: 'medium', fontSize: '1.2rem' }}>Total ₹{workspace.amount}</Typography>
                                <Typography variant="body2" sx={{ color: '#ff4500', marginBottom: 0.5, fontWeight: 'medium', fontSize: '1.2rem' }}>Expenses ₹{workspace.totalExpenses}</Typography>
                                <Typography variant="body2" sx={{ color: '#4169e1', fontWeight: 'medium', fontSize: '1.2rem' }}>Available ₹{workspace.amount - workspace.totalExpenses}</Typography>
                            </Box>

                            <Box sx={{display:'flex',justifyContent:'end',width:'100%'}}>
                                
                            <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 'medium', fontSize: '1rem',mt:1 }}>Date : {new Date(workspace.date).toLocaleDateString()}</Typography>
                            </Box>

                        </Paper>
                    </Grid>
                ))}

                <Grid item xs={12}>
                    <Button variant="contained" color="primary" onClick={handleOpenModal} fullWidth={isMobile}>
                        Add Workspace
                    </Button>
                </Grid>
            </Grid>

            <Modal open={openModal} onClose={handleCloseModal}>
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: isMobile ? '90%' : 400,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                }}>
                    <Typography variant="h6" component="h2">Add New Workspace</Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="workspace-name"
                        label="Workspace Name"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        id="workspace-amount"
                        label="Amount"
                        type="number"
                        fullWidth
                        variant="standard"
                        value={workspaceAmount}
                        onChange={(e) => setWorkspaceAmount(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        id="workspace-date"
                        label="Date"
                        type="date"
                        fullWidth
                        variant="standard"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        InputLabelProps={{ shrink: true }} // Ensures label doesn't overlap the value
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
                        <Button onClick={handleCloseModal} sx={{ marginRight: 1 }}>Cancel</Button>
                        <Button onClick={handleAddWorkspace} disabled={!workspaceName || !workspaceAmount || workspaceAmount <= 0 || !date} variant="contained">Add</Button>
                    </Box>
                </Box>
            </Modal>
        </Box>
    );
};

export default Dashboard;
