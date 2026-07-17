import React, { useState } from 'react';
import { Card, Form, Button, Container } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      login(data.user, data.tokens);
      toast.success('Successfully logged in!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center py-5">
      <Card className="shadow-sm rounded-0 border-0" style={{ width: '100%', maxWidth: '400px' }}>
        <Card.Body className="p-5">
          <h3 className="text-center fw-bold mb-4 text-uppercase" style={{ letterSpacing: '2px' }}>Login</h3>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4" controlId="formBasicEmail">
              <Form.Label className="small fw-bold text-uppercase text-muted">Email Address</Form.Label>
              <Form.Control 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-0 border-dark"
                required
              />
            </Form.Group>
            <Form.Group className="mb-4" controlId="formBasicPassword">
              <Form.Label className="small fw-bold text-uppercase text-muted">Password</Form.Label>
              <Form.Control 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-0 border-dark"
                required
              />
            </Form.Group>
            <Button 
              type="submit" 
              variant="dark" 
              className="w-100 rounded-0 text-uppercase py-2 fw-bold"
              disabled={loading}
              style={{ letterSpacing: '1px' }}
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </Button>
          </Form>
          <div className="text-center mt-4">
            <span className="text-muted small">Don't have an account? </span>
            <Link to="/signup" className="text-dark fw-bold small text-decoration-none">REGISTER</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;
