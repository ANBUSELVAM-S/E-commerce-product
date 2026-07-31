import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import { getProducts } from '../services/productService';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

// Placeholder icons for stats
import { FiBox, FiUsers, FiTrendingUp, FiSmile } from 'react-icons/fi';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Filters for "Best Sellers"
  const filters = ['All', 'New arrivals', 'Stylish products', 'Womens'];
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    fetchProducts();
  }, [activeFilter, location.search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Map 'New arrivals' to a search term or logic if you had it in the backend
      // For now, we'll just fetch all products
      const data = await getProducts();
      setProducts(data.products || data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="dream-hero mb-5">
        <Container>
          <Row>
            <Col md={6} className="dream-hero-content d-flex flex-column justify-content-center">
              <h1 className="dream-hero-title">FASHION ARE UNIQUE</h1>
              <div className="dream-hero-subtitle script-font">Trending winter collection</div>
              <div>
                <button className="btn-dream">Explore More</button>
              </div>
            </Col>
          </Row>
        </Container>
        {/* Absolute positioned hero image to match reference layout */}
        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhcYaUB2FHZZEfgyy3palGETRN1o0_mK2gz6y-Pm0F1bgDns326flyaVZA&s=10" alt="Model" className="dream-hero-img d-none d-md-block" />
      </section>

      {/* Categories Masonry Grid */}
      <section className="mb-5">
        <Container>
          <div className="text-center mb-4">
            <h3 className="text-uppercase" style={{ fontSize: '18px', letterSpacing: '2px' }}>Categories</h3>
          </div>
          <Row className="g-2 position-relative">
            <Col md={3} className="category-box" style={{ height: '400px' }}>
              <img src="https://images.unsplash.com/photo-1491933382434-500287f9b54b?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGdhZGdldHN8ZW58MHx8MHx8fDA%3D" className="category-img" alt="Cat 1" />
            </Col>
            <Col md={6}>
              <Row className="g-2 h-100">
                <Col xs={6} className="category-box" style={{ height: '196px' }}>
                  <img src="https://img.magnific.com/free-photo/galaxy-nature-aesthetic-background-starry-sky-mountain-remixed-media_53876-126761.jpg?semt=ais_test_b&w=740&q=80" className="category-img" alt="Cat 2" />
                </Col>
                <Col xs={6} className="category-box" style={{ height: '196px' }}>
                  <img src="https://images.unsplash.com/photo-1509319117193-57bab727e09d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" className="category-img" alt="Cat 3" />
                </Col>
                <Col xs={6} className="category-box" style={{ height: '196px' }}>
                  <img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" className="category-img" alt="Cat 4" />
                </Col>
                <Col xs={6} className="category-box" style={{ height: '196px' }}>
                  <img src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" className="category-img" alt="Cat 5" />
                </Col>
              </Row>
            </Col>
            <Col md={3} className="category-box" style={{ height: '400px' }}>
              <img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" className="category-img" alt="Cat 6" />
              <div className="position-absolute script-font text-muted" style={{ right: '-30px', top: '50%', transform: 'rotate(-90deg)', fontSize: '24px' }}>
                Trending Collections
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="mb-5 py-4 bg-light-grey">
        <Container>
          <Row className="text-center g-4">
            <Col xs={6} md={3}>
              <FiBox size={30} className="mb-3 text-muted" />
              <div className="text-muted text-uppercase mb-2" style={{ fontSize: '12px', letterSpacing: '1px' }}>Product</div>
              <h3 className="fw-bold m-0">757</h3>
            </Col>
            <Col xs={6} md={3}>
              <FiUsers size={30} className="mb-3 text-muted" />
              <div className="text-muted text-uppercase mb-2" style={{ fontSize: '12px', letterSpacing: '1px' }}>Followers</div>
              <h3 className="fw-bold m-0">222</h3>
            </Col>
            <Col xs={6} md={3}>
              <FiTrendingUp size={30} className="mb-3 text-muted" />
              <div className="text-muted text-uppercase mb-2" style={{ fontSize: '12px', letterSpacing: '1px' }}>Monthly Sales</div>
              <h3 className="fw-bold m-0">646</h3>
            </Col>
            <Col xs={6} md={3}>
              <FiSmile size={30} className="mb-3 text-muted" />
              <div className="text-muted text-uppercase mb-2" style={{ fontSize: '12px', letterSpacing: '1px' }}>Happy Customers</div>
              <h3 className="fw-bold m-0">98%</h3>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Best Sellers Section */}
      <section className="mb-5 pb-5">
        <Container>
          <div className="text-center mb-4">
            <h2 className="mb-2">Best sellers</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '500px', fontSize: '12px' }}>
              Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes.
            </p>
          </div>

          {/* Filters */}
          {/* <div className="d-flex justify-content-center gap-2 mb-5">
            {filters.map(f => (
              <button 
                key={f}
                className={`btn-dream-outline ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div> */}

          {/* Product Grid */}
          {loading ? (
            <LoadingSpinner />
          ) : products.length === 0 ? (
            <div className="text-center py-5">
              <h4 className="text-muted script-font">No products found.</h4>
            </div>
          ) : (
            <Row xs={1} sm={2} md={3} lg={4} className="g-4">
              {products.map((product) => (
                <Col key={product._id || product.productId}>
                  <ProductCard product={product} />
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* Brands & Instagram (Static UI) */}
      {/* <section className="mb-5 text-center">
        <Container>
          <h4 className="mb-4">Brands</h4>
          <div className="d-flex justify-content-center flex-wrap gap-5 opacity-50 mb-5">
            <h5 className="script-font">Interior</h5>
            <h5 className="script-font">Design Studio</h5>
            <h5 className="script-font">Brand</h5>
            <h5 className="script-font">Caley</h5>
          </div>
          
          <h4 className="mb-4">Instagram Community</h4>
          <Row className="g-0 mb-3">
            {[1,2,3,4,5].map(i => (
              <Col key={i}>
                <img src={`https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80`} className="img-fluid" alt={`Insta ${i}`} />
              </Col>
            ))}
          </Row>
          <div className="text-end script-font text-muted fs-5">Check our Instagram...</div>
        </Container>
      </section> */}

      {/* Newsletter */}
      <section className="newsletter-section mb-0">
        <Container>
          <h2 className="mb-3">Newsletter</h2>
          <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '400px', fontSize: '13px' }}>
            Adipiscing commodo elit at imperdiet dui accumsan sit amet nulla.
          </p>
          <div className="d-flex justify-content-center">
            <input type="email" className="newsletter-input" placeholder="Your email address..." />
            <button className="btn-dream" style={{ marginLeft: '-1px' }}>Join Us</button>
          </div>
        </Container>
      </section>
    </>
  );
};

export default Home;
