import React, { useState } from 'react';
import { Card, Form, Button, Container } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/authService';
import { toast } from 'react-toastify';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerUser(email, password, role);
      toast.success('Registration successful! Please check your email for the verification code.');
      navigate('/confirm', { state: { email } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center py-5">
      <Card className="shadow-sm rounded-0 border-0" style={{ width: '100%', maxWidth: '450px' }}>
        <Card.Body className="p-5">
          <h3 className="text-center fw-bold mb-4 text-uppercase" style={{ letterSpacing: '2px' }}>Create Account</h3>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-uppercase text-muted">Email Address</Form.Label>
              <Form.Control 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-0 border-dark"
                required
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-uppercase text-muted">Password</Form.Label>
              <Form.Control 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-0 border-dark"
                required
                minLength={8}
              />
              <Form.Text className="text-muted small">Must be at least 8 characters</Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-uppercase text-muted">Account Type</Form.Label>
              <div className="d-flex gap-3">
                <Form.Check 
                  type="radio"
                  id="role-user"
                  label="Customer"
                  name="role"
                  value="user"
                  checked={role === 'user'}
                  onChange={(e) => setRole(e.target.value)}
                />
                <Form.Check 
                  type="radio"
                  id="role-admin"
                  label="Admin"
                  name="role"
                  value="admin"
                  checked={role === 'admin'}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>
            </Form.Group>

            <Button 
              type="submit" 
              variant="dark" 
              className="w-100 rounded-0 text-uppercase py-2 fw-bold"
              disabled={loading}
              style={{ letterSpacing: '1px' }}
            >
              {loading ? 'Registering...' : 'Sign Up'}
            </Button>
          </Form>
          <div className="text-center mt-4">
            <span className="text-muted small">Already have an account? </span>
            <Link to="/login" className="text-dark fw-bold small text-decoration-none">LOGIN</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Signup;
