import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Image, Button, Badge } from 'react-bootstrap';
import { FiShoppingCart, FiArrowLeft } from 'react-icons/fi';
import { getProductById } from '../services/productService';
import { useCart } from '../context/CartContext';
import LoadingSpinner from '../components/LoadingSpinner';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(id);
        setProduct(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!product) return <h4 className="text-center mt-5">Product not found</h4>;

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  return (
    <div>
      <Button variant="link" className="text-decoration-none text-muted mb-4 px-0" onClick={() => navigate(-1)}>
        <FiArrowLeft className="me-2" /> Back to Products
      </Button>

      <Row className="g-5">
        <Col md={6}>
          <Image 
            src={product.imageUrl || `https://via.placeholder.com/600x400?text=${encodeURIComponent(product.name)}`} 
            alt={product.name} 
            fluid 
            rounded 
            className="shadow-sm w-100 object-fit-cover"
            style={{ maxHeight: '500px' }}
          />
        </Col>
        <Col md={6} className="d-flex flex-column">
          <div>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Badge bg="secondary">{product.category}</Badge>
              <span className={product.stock > 0 ? "text-success fw-bold" : "text-danger fw-bold"}>
                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
            <h1 className="fw-bold mb-3">{product.name}</h1>
            <h2 className="text-success fw-bold mb-4">${product.price.toFixed(2)}</h2>
            <p className="text-muted fs-5 mb-4">{product.description}</p>
          </div>

          <div className="mt-auto">
            {product.stock > 0 && (
              <div className="d-flex align-items-center mb-4">
                <span className="me-3 fw-bold">Quantity:</span>
                <div className="input-group" style={{ width: '130px' }}>
                  <button className="btn btn-outline-secondary" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                  <input type="number" className="form-control text-center" value={quantity} readOnly />
                  <button className="btn btn-outline-secondary" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
                </div>
              </div>
            )}

            <div className="d-grid gap-2 d-md-flex">
              <Button 
                variant="warning" 
                size="lg" 
                className="px-5 shadow-sm"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
              >
                <FiShoppingCart className="me-2" /> Add to Cart
              </Button>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ProductDetails;
