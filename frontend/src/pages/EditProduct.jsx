import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import config from '../config/config';
import '../styles/EditProduct.css';

function EditProduct() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: 'New',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    whatsapp: '',
    quantity: 1,
    unit: 'piece',
    availability: 'Available'
  });
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);

  const categories = [
    'Seeds', 'Fertilizers', 'Tools', 'Organic Products',
    'Pesticides', 'Equipment', 'Fruits', 'Vegetables', 
    'Grains', 'Dairy', 'Other'
  ];

  const conditions = ['New', 'Used', 'Refurbished'];
  const units = ['piece', 'kg', 'liter', 'ton', 'quintal', 'dozen'];
  const availabilityOptions = ['Available', 'Sold', 'Out of Stock'];

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  // Reload only when the selected product changes.
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchProduct();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user, navigate]);

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(config.getApiUrl(`/api/marketplace/products/${id}`), {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const product = data.data;

        // Check if user owns this product
        if (product.seller._id !== user._id && !user.isAdmin) {
          setError('You are not authorized to edit this product');
          return;
        }

        // Populate form data
        setFormData({
          title: product.title || '',
          description: product.description || '',
          price: product.price || '',
          category: product.category || '',
          condition: product.condition || 'New',
          city: product.location?.city || '',
          state: product.location?.state || '',
          pincode: product.location?.pincode || '',
          phone: product.contactInfo?.phone || '',
          email: product.contactInfo?.email || '',
          whatsapp: product.contactInfo?.whatsapp || '',
          quantity: product.quantity || 1,
          unit: product.unit || 'piece',
          availability: product.availability || 'Available'
        });

        setExistingImages(product.images || []);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch product');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + existingImages.length + newImages.length > 5) {
      alert('You can have maximum 5 images total');
      return;
    }

    setNewImages(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewImagePreviews(prev => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (existingImages.length + newImages.length === 0) {
      alert('Please keep at least one image');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const submitData = new FormData();
      
      // Append form data
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });

      // Append existing images that should be kept
      existingImages.forEach(image => {
        submitData.append('existingImages', image);
      });

      // Append new images
      newImages.forEach(image => {
        submitData.append('images', image);
      });

      const response = await fetch(config.getApiUrl(`/api/marketplace/products/${id}`), {
        method: 'PUT',
        credentials: 'include',
        body: submitData
      });

      if (response.ok) {
        const result = await response.json();
        alert('✅ Product updated successfully!');
        navigate(`/marketplace/product/${result.data._id}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Seeds': '🌰',
      'Fertilizers': '🧪',
      'Tools': '🔧',
      'Organic Products': '🌱',
      'Pesticides': '🐛',
      'Equipment': '🚜',
      'Fruits': '🍎',
      'Vegetables': '🥕',
      'Grains': '🌾',
      'Dairy': '🥛',
      'Other': '📦'
    };
    return icons[category] || '📦';
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="edit-product-container">
        <div className="loading">🔄 Loading product...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="edit-product-container">
        <div className="error-state">
          <h2>❌ {error}</h2>
          <div className="error-actions">
            <button onClick={() => navigate('/marketplace')} className="back-btn">
              ← Back to Marketplace
            </button>
            <button onClick={() => navigate('/marketplace/my-products')} className="my-products-btn">
              📦 My Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-product-container">
      <div className="edit-header">
        <h1>✏️ Edit Product</h1>
        <p>Update your product information</p>
      </div>

      <form onSubmit={handleSubmit} className="edit-form">
        {/* Basic Information */}
        <div className="form-section">
          <h3>📝 Basic Information</h3>
          
          <div className="form-group">
            <label htmlFor="title">Product Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              maxLength={1000}
            />
            <div className="char-count">{formData.description.length}/1000</div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {getCategoryIcon(cat)} {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="condition">Condition *</label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                required
              >
                {conditions.map(condition => (
                  <option key={condition} value={condition}>
                    ✨ {condition}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="availability">Availability *</label>
              <select
                id="availability"
                name="availability"
                value={formData.availability}
                onChange={handleChange}
                required
              >
                {availabilityOptions.map(option => (
                  <option key={option} value={option}>
                    {option === 'Available' ? '✅' : 
                     option === 'Sold' ? '❌' : '⚠️'} {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing & Quantity */}
        <div className="form-section">
          <h3>💰 Pricing & Quantity</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price (₹) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label htmlFor="quantity">Quantity *</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                min="1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="unit">Unit *</label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                required
              >
                {units.map(unit => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="form-section">
          <h3>📸 Product Images</h3>
          
          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div className="existing-images">
              <h4>Current Images:</h4>
              <div className="images-grid">
                {existingImages.map((image, index) => (
                  <div key={index} className="image-item">
                    <img 
                      src={config.getAssetUrl(image)}
                      alt={`Product ${index + 1}`}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/150x150?text=No+Image';
                      }}
                    />
                    <button 
                      type="button" 
                      onClick={() => removeExistingImage(index)}
                      className="remove-image-btn"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Images */}
          <div className="add-images">
            <h4>Add New Images:</h4>
            <div className="image-upload">
              <input
                type="file"
                id="images"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
              />
              <label htmlFor="images" className="file-label">
                📁 Choose Images
              </label>
            </div>

            {newImagePreviews.length > 0 && (
              <div className="new-images-grid">
                {newImagePreviews.map((preview, index) => (
                  <div key={index} className="image-item">
                    <img src={preview} alt={`New ${index + 1}`} />
                    <button 
                      type="button" 
                      onClick={() => removeNewImage(index)}
                      className="remove-image-btn"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="form-section">
          <h3>📍 Location</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City *</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="state">State *</label>
              <select
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
              >
                <option value="">Select State</option>
                {indianStates.map(state => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="pincode">Pincode</label>
              <input
                type="text"
                id="pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                pattern="[0-9]{6}"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="form-section">
          <h3>📞 Contact Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="whatsapp">WhatsApp Number</label>
              <input
                type="tel"
                id="whatsapp"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(`/marketplace/product/${id}`)}
            className="cancel-btn"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="submit-btn"
          >
            {saving ? '🔄 Updating...' : '💾 Update Product'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProduct;
