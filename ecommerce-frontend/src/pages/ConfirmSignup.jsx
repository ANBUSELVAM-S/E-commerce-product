import React, { useState } from 'react';
import { Card, Form, Button, Container } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { confirmUser } from '../services/authService';
import { toast } from 'react-toastify';

const ConfirmSignup = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log("EMAIL:", email);
console.log("CODE:", code);
console.log("CODE LENGTH:", code.length);
      await confirmUser(email, code);
      toast.success('Account verified successfully! You can now login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center py-5">
      <Card className="shadow-sm rounded-0 border-0" style={{ width: '100%', maxWidth: '400px' }}>
        <Card.Body className="p-5">
          <h3 className="text-center fw-bold mb-4 text-uppercase" style={{ letterSpacing: '2px' }}>Verify Account</h3>
          <p className="text-center text-muted small mb-4">
            Enter the 6-digit confirmation code sent to your email.
          </p>
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
              <Form.Label className="small fw-bold text-uppercase text-muted">Confirmation Code</Form.Label>
              <Form.Control 
                type="text" 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="rounded-0 border-dark text-center"
                style={{ letterSpacing: '5px', fontSize: '18px' }}
                required
                maxLength={6}
              />
            </Form.Group>
            <Button 
              type="submit" 
              variant="dark" 
              className="w-100 rounded-0 text-uppercase py-2 fw-bold"
              disabled={loading}
              style={{ letterSpacing: '1px' }}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ConfirmSignup;
