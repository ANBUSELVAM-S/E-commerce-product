import React, { useState } from 'react';
import { Container, Form, Alert, Row, Col } from 'react-bootstrap';
import { createProduct } from '../services/productService';
import { toast } from 'react-toastify';

const AdminAddProduct = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Books', 
    stock: '',
    imageUrl: ''
  });

  const categories = ['Accessories', 'Shoes','Books','Clothing','Electronics'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const productData = {
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock)
      };

      await createProduct(productData);
      
      toast.success('Product added successfully!');
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'Womens',
        stock: '',
        imageUrl: ''
      });
      
    } catch (error) {
      console.error("FULL ERROR DETAILS:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-light-grey" style={{ minHeight: '80vh', padding: '60px 0' }}>
      <Container style={{ maxWidth: '700px' }}>
        <div className="bg-white p-5 shadow-sm">
          <div className="text-center mb-5">
            <h2 className="mb-2">Add New Product</h2>
            <div className="script-font">Admin Dashboard</div>
          </div>
          
          <Alert variant="secondary" className="border-0 text-center rounded-0 mb-5" style={{ fontSize: '13px' }}>
            New products will automatically appear in the Best Sellers section on the Home page.
          </Alert>
          
          <Form onSubmit={handleSubmit}>
            <Row className="g-4 mb-4">
              <Col md={7}>
                <Form.Group>
                  <Form.Label className="text-uppercase" style={{ fontSize: '12px', fontWeight: 600 }}>Product Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="name" 
                    className="border-0 bg-light-grey rounded-0 p-3"
                    required 
                    value={formData.name}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group>
                  <Form.Label className="text-uppercase" style={{ fontSize: '12px', fontWeight: 600 }}>Category</Form.Label>
                  <Form.Select 
                    name="category"
                    className="border-0 bg-light-grey rounded-0 p-3"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label className="text-uppercase" style={{ fontSize: '12px', fontWeight: 600 }}>Description</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={4}
                name="description" 
                className="border-0 bg-light-grey rounded-0 p-3"
                required 
                value={formData.description}
                onChange={handleChange}
              />
            </Form.Group>

            <Row className="g-4 mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="text-uppercase" style={{ fontSize: '12px', fontWeight: 600 }}>Price (USD)</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01"
                    min="0"
                    name="price" 
                    className="border-0 bg-light-grey rounded-0 p-3"
                    required 
                    value={formData.price}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="text-uppercase" style={{ fontSize: '12px', fontWeight: 600 }}>Stock</Form.Label>
                  <Form.Control 
                    type="number" 
                    min="0"
                    name="stock" 
                    className="border-0 bg-light-grey rounded-0 p-3"
                    required 
                    value={formData.stock}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-5">
              <Form.Label className="text-uppercase" style={{ fontSize: '12px', fontWeight: 600 }}>Image URL</Form.Label>
              <Form.Control 
                type="url" 
                name="imageUrl" 
                className="border-0 bg-light-grey rounded-0 p-3"
                placeholder="https://" 
                value={formData.imageUrl}
                onChange={handleChange}
              />
            </Form.Group>

            <div className="d-grid">
              <button type="submit" className="btn-dream p-3" disabled={loading}>
                {loading ? 'SAVING...' : 'PUBLISH PRODUCT'}
              </button>
            </div>
          </Form>
        </div>
      </Container>
    </div>
  );
};

export default AdminAddProduct;
