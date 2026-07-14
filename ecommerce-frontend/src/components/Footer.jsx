import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FiFacebook, FiTwitter, FiInstagram, FiYoutube } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="bg-white mt-auto pt-5">
      <Container className="mb-5">
        <Row className="g-4">
          <Col md={3}>
            <h4 className="dream-brand fs-5 mb-4">DREAM CENTER</h4>
            <div className="d-flex gap-2">
              <img src="https://www.investopedia.com/thmb/F8CKM3YkF1fmnRCU2g4knuK0eDY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/MClogo-c823e495c5cf455c89ddfb0e17fc7978.jpg" height="20" alt="Mastercard"/>
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRezbdm03JkdGxgl7Zg4LGP8YRoz9PxRI8LJpJPhBp8AQ&s=10" height="20" alt="Visa"/>
              <img src="https://images.seeklogo.com/logo-png/24/1/paypal-logo-png_seeklogo-249214.png" height="20" alt="Paypal"/>
            </div>
          </Col>
          <Col md={3}></Col>
          <Col md={3}>
            <h6 className="fw-bold text-uppercase mb-3" style={{ fontSize: '14px' }}>Support</h6>
            <ul className="list-unstyled text-muted" style={{ fontSize: '13px', lineHeight: '2' }}>
              <li><a href="#" className="text-muted text-decoration-none">Track an order</a></li>
              <li><a href="#" className="text-muted text-decoration-none">Delivery info</a></li>
              <li><a href="#" className="text-muted text-decoration-none">Returns Policy</a></li>
              <li><a href="#" className="text-muted text-decoration-none">Gift Card</a></li>
            </ul>
          </Col>
          <Col md={3}>
            <h6 className="fw-bold text-uppercase mb-3" style={{ fontSize: '14px' }}>About Us</h6>
            <p className="text-muted" style={{ fontSize: '13px' }}>
              anbuselvam@gmail.com<br></br>
              9876654567
            </p>
            <div className="d-flex gap-3 text-muted">
              <FiTwitter />
              <FiFacebook />
              <FiInstagram />
              <FiYoutube />
            </div>
          </Col>
        </Row>
      </Container>
      
      {/* Bottom Bar */}
      <div className="bg-accent text-white py-3">
        <Container className="d-flex justify-content-between align-items-center" style={{ fontSize: '12px' }}>
          <div>&copy; {new Date().getFullYear()} Dream Center. All rights reserved.</div>
          <div className="d-flex gap-3">
            <a href="#" className="text-white text-decoration-none opacity-75">Contact</a>
            <a href="#" className="text-white text-decoration-none opacity-75">FAQ</a>
            <a href="#" className="text-white text-decoration-none opacity-75">Orders</a>
            <a href="#" className="text-white text-decoration-none opacity-75">Help</a>
            <a href="#" className="text-white text-decoration-none opacity-75">Privacy Policy</a>
          </div>
        </Container>
      </div>
    </footer>
  );
};

export default Footer;
