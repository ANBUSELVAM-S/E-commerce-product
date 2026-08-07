import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Button, Modal, Form } from 'react-bootstrap';
import { getInventory, adjustStock, deleteInventory } from '../services/inventoryService';
import { getProducts, deleteProduct } from '../services/productService';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

const AdminInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  // Form State
  const [adjustmentType, setAdjustmentType] = useState('addition');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const [inventoryData, productsData] = await Promise.all([
        getInventory(),
        getProducts()
      ]);
      
      const mergedInventory = inventoryData.map(item => {
        const product = productsData.products ? productsData.products.find(p => p.productId === item.productId) : productsData.find(p => p.productId === item.productId);
        return {
          ...item,
          imageUrl: product?.imageUrl || null
        };
      });
      
      setInventory(mergedInventory);
    } catch (error) {
      toast.error('Failed to load inventory data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUpdate = (item) => {
    setSelectedItem(item);
    setAdjustmentType('addition');
    setQuantity(1);
    setReason('');
    setShowModal(true);
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    try {
      setUpdating(true);
      await adjustStock(selectedItem.productId, {
        type: adjustmentType,
        quantity: Number(quantity),
        reason
      });
      toast.success('Inventory updated successfully');
      setShowModal(false);
      fetchInventory(); // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update inventory');
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenDelete = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleDeleteProduct = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      
      // Try to delete product (might already be deleted if it was orphaned)
      try {
        await deleteProduct(itemToDelete.productId);
      } catch (productError) {
        console.warn('Product might already be deleted:', productError);
      }
      
      // Delete the inventory record so it doesn't show up orphaned
      try {
        await deleteInventory(itemToDelete.productId);
      } catch (inventoryError) {
        console.error('Inventory deletion error:', inventoryError);
      }
      
      toast.success('Deleted successfully');
      setShowDeleteModal(false);
      fetchInventory(); // Refresh list
    } catch (error) {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Container className="py-5" style={{ maxWidth: '1000px' }}>
      <div className="text-center mb-5">
        <h2 className="mb-2">Inventory Management</h2>
        <div className="script-font">Track and update stock levels</div>
      </div>

      <Card className="shadow-sm border-0 rounded-0">
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="bg-light-grey text-uppercase" style={{ fontSize: '11px', letterSpacing: '1px' }}>
              <tr>
                <th className="px-4 py-3 border-0">Product ID</th>
                <th className="py-3 border-0">Product Name</th>
                <th className="py-3 border-0 text-center">Available Stock</th>
                <th className="py-3 border-0 text-center">Current Stock</th>
                <th className="py-3 border-0 text-center">Reserved Stock</th>
                <th className="px-4 py-3 border-0 text-end">Actions</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '13px' }}>
              {inventory.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-4">No inventory items found.</td></tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.productId}>
                    <td className="px-4 py-3 font-monospace text-muted" style={{ fontSize: '12px' }}>{item.productId.substring(0, 10)}...</td>
                    <td className="py-3 fw-bold">
                      <div className="d-flex align-items-center">
                        {item.imageUrl && (
                          <img 
                            src={item.imageUrl} 
                            alt={item.productName} 
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                            className="me-3"
                          />
                        )}
                        <span>{item.productName}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <Badge bg={item.availableStock <= item.lowStockThreshold ? 'danger' : 'success'} className="rounded-0 px-3 py-2">
                        {item.availableStock}
                      </Badge>
                    </td>
                    <td className="py-3 text-center text-muted fw-bold">{item.currentStock}</td>
                    <td className="py-3 text-center text-muted">{item.reservedStock}</td>
                    <td className="px-4 py-3 text-end">
                      <div className="d-flex gap-2 justify-content-end">
                        <Button 
                          variant="outline-dark" 
                          size="sm" 
                          className="rounded-0 text-uppercase"
                          style={{ fontSize: '10px', letterSpacing: '1px' }}
                          onClick={() => handleOpenUpdate(item)}
                        >
                          Update Stock
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          className="rounded-0 text-uppercase"
                          style={{ fontSize: '10px', letterSpacing: '1px' }}
                          onClick={() => handleOpenDelete(item)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Update Stock Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="fw-bold text-uppercase" style={{ letterSpacing: '1px', fontSize: '18px' }}>
            Adjust Inventory
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateStock}>
          <Modal.Body className="pt-2 pb-4 px-4">
            {selectedItem && (
              <>
                <div className="mb-4 d-flex align-items-center">
                  {selectedItem.imageUrl && (
                    <img 
                      src={selectedItem.imageUrl} 
                      alt={selectedItem.productName} 
                      style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                      className="me-3"
                    />
                  )}
                  <div>
                    <p className="text-muted small mb-1">Updating stock for:</p>
                    <h6 className="fw-bold m-0">{selectedItem.productName}</h6>
                  </div>
                </div>
                
                <div className="d-flex justify-content-between mb-4 p-3 bg-light text-muted small">
                  <div>Available: <span className="fw-bold text-dark">{selectedItem.availableStock}</span></div>
                  <div>Current: <span className="fw-bold text-dark">{selectedItem.currentStock}</span></div>
                  <div>Reserved: <span className="fw-bold text-dark">{selectedItem.reservedStock}</span></div>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label className="small text-uppercase fw-bold text-muted">Adjustment Type</Form.Label>
                  <Form.Select 
                    className="rounded-0"
                    value={adjustmentType} 
                    onChange={(e) => setAdjustmentType(e.target.value)}
                  >
                    <option value="addition">Add Stock (+)</option>
                    <option value="removal">Remove Stock (-)</option>
                    <option value="reservation">Reserve Stock</option>
                    <option value="release">Release Reserved Stock</option>
                    <option value="adjustment">Set Absolute Current Stock (=)</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small text-uppercase fw-bold text-muted">Quantity</Form.Label>
                  <Form.Control 
                    type="number" 
                    min="1"
                    className="rounded-0"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small text-uppercase fw-bold text-muted">Reason (Optional)</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="e.g. New shipment arrived"
                    className="rounded-0"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer className="border-top-0 pt-0 px-4 pb-4">
            <Button 
              variant="dark" 
              type="submit" 
              className="rounded-0 text-uppercase w-100 fw-bold"
              style={{ letterSpacing: '1px' }}
              disabled={updating}
            >
              {updating ? 'Updating...' : 'Confirm Update'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="fw-bold text-uppercase text-danger" style={{ letterSpacing: '1px', fontSize: '18px' }}>
            Confirm Deletion
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2 pb-4 px-4">
          {itemToDelete && (
            <>
              <p className="text-muted mb-4">Are you sure you want to delete this product? This action cannot be undone.</p>
              <div className="mb-2 d-flex align-items-center bg-light p-3 rounded">
                {itemToDelete.imageUrl && (
                  <img 
                    src={itemToDelete.imageUrl} 
                    alt={itemToDelete.productName} 
                    style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                    className="me-3"
                  />
                )}
                <div>
                  <h6 className="fw-bold m-0">{itemToDelete.productName}</h6>
                  <p className="text-muted small m-0">ID: {itemToDelete.productId}</p>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-0 px-4 pb-4">
          <Button 
            variant="outline-dark" 
            className="rounded-0 text-uppercase fw-bold"
            style={{ letterSpacing: '1px' }}
            onClick={() => setShowDeleteModal(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            className="rounded-0 text-uppercase fw-bold"
            style={{ letterSpacing: '1px' }}
            onClick={handleDeleteProduct}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Product'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminInventory;
