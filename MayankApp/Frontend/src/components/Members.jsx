import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Modal,
    TextField,
    Typography,
    CircularProgress,
    Snackbar,
    Grid,
    Paper,
} from '@mui/material';
import axios from 'axios';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

const Members = () => {
    const [openModal, setOpenModal] = useState(false);
    const [memberName, setMemberName] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    const { workspaceId } = useParams();
    const location = useLocation();

    useEffect(() => {
        fetchMembers();
    }, [workspaceId]);

    useEffect(() => {
        if (location.state?.totalExpense) {
            const updatedMembers = members.map(member => {
                if (member._id === location.state.memberId) {
                    return { ...member, totalExpenses: location.state.totalExpense };
                }
                return member;
            });
            setMembers(updatedMembers);
        }
    }, [location.state, members]);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/workspaces/${workspaceId}/members`);
            setMembers(res.data); // This should include the totalExpenses for each member
        } catch (error) {
            console.error('Error fetching members', error);
            setErrorMessage(error.response?.data.error || 'Failed to fetch members. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => setOpenModal(true);
    const handleCloseModal = () => {
        setOpenModal(false);
        setErrorMessage('');
    };

    const handleAddMember = async () => {
        if (memberName && contactNumber) {
            const newMember = {
                name: memberName,
                contactNumber,
                workspaceId,
            };

            setLoading(true);
            try {
                const res = await axios.post('http://localhost:5000/api/members', newMember);
                setMembers((prevMembers) => [...prevMembers, res.data]);
                setSuccessMessage('Member added successfully!');
                setMemberName('');
                setContactNumber('');
                handleCloseModal();
            } catch (error) {
                console.error('Error adding member', error);
                setErrorMessage('Failed to add member. Please try again.');
            } finally {
                setLoading(false);
            }
        } else {
            setErrorMessage('Please fill in all fields correctly.');
        }
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    const handleMemberClick = (memberId) => {
        navigate(`/workspace/${workspaceId}/member/${memberId}/expenses`, { state: { memberId } });
    };

    return (
        <Box sx={{ padding: 4 }}>
            <Button variant="outlined" onClick={handleGoBack} sx={{ marginBottom: 2 }}>
                Back
            </Button>
            <Typography variant="h4" gutterBottom>
                Members of Workspace
            </Typography>
            <Button variant="contained" color="primary" onClick={handleOpenModal} sx={{ marginBottom: 2 }}>
                Add Member
            </Button>

            {loading ? (
                <CircularProgress />
            ) : (
                <Grid container spacing={2}>
                    {members.map((member) => (
                        <Grid item xs={12} sm={6} md={3} key={member._id}>
                            <Paper
                                elevation={3}
                                sx={{
                                    padding: 2,
                                    cursor: 'pointer',
                                    backgroundColor: `hsl(${Math.random() * 360}, 70%, 80%)`,
                                    '&:hover': { opacity: 0.8 },
                                }}
                                onClick={() => handleMemberClick(member._id)}
                            >
                                <Typography variant="h6">{member.name}</Typography>
                                <Typography variant="body2">{member.contactNumber}</Typography>
                                <Typography variant="body2" sx={{fontSize:"20px",color:"green"}}>Total Expenses: ₹{member.totalExpenses || 0}</Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Modal open={openModal} onClose={handleCloseModal} aria-labelledby="add-member-modal">
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 400,
                        bgcolor: 'background.paper',
                        boxShadow: 24,
                        p: 4,
                    }}
                >
                    <Typography id="add-member-modal" variant="h6" component="h2">
                        Add New Member
                    </Typography>
                    <TextField
                        label="Member Name"
                        value={memberName}
                        onChange={(e) => setMemberName(e.target.value)}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Contact Number"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        fullWidth
                        margin="normal"
                    />
                    <Button variant="contained" onClick={handleAddMember} sx={{ marginTop: 2 }}>
                        Add Member
                    </Button>
                    {errorMessage && (
                        <Typography color="error" variant="body2">
                            {errorMessage}
                        </Typography>
                    )}
                </Box>
            </Modal>

            <Snackbar
                open={!!successMessage}
                autoHideDuration={6000}
                onClose={() => setSuccessMessage('')}
                message={successMessage}
            />
        </Box>
    );
};

export default Members;
