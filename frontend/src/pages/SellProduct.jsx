import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import config from '../config/config';
import '../styles/SellProduct.css';

function SellProduct() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: 'New',
    city: '',
    state: '',
    pincode: '',
    phone: user?.phone || '',
    email: user?.email || '',
    whatsapp: '',
    quantity: 1,
    unit: 'piece'
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const categories = [
    'Seeds', 'Fertilizers', 'Tools', 'Organic Products',
    'Pesticides', 'Equipment', 'Fruits', 'Vegetables', 
    'Grains', 'Dairy', 'Other'
  ];

  const conditions = ['New', 'Used', 'Refurbished'];
  const units = ['piece', 'kg', 'liter', 'ton', 'quintal', 'dozen'];

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + images.length > 5) {
      alert('You can upload maximum 5 images');
      return;
    }

    setImages(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }

    if (images.length === 0) {
      alert('Please upload at least one image');
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      
      // Append form data
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });

      // Append images
      images.forEach(image => {
        submitData.append('images', image);
      });

      const response = await fetch(config.getApiUrl('/api/marketplace/products'), {
        method: 'POST',
        credentials: 'include',
        body: submitData
      });

      if (response.ok) {
        const result = await response.json();
        alert(' Product listed successfully!');
        navigate(`/marketplace/product/${result.data._id}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to list product');
      }
    } catch (error) {
      console.error('Error listing product:', error);
      alert(' Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Seeds': '',
      'Fertilizers': '',
      'Tools': '',
      'Organic Products': '',
      'Pesticides': '',
      'Equipment': '',
      'Fruits': '',
      'Vegetables': '',
      'Grains': '',
      'Dairy': '',
      'Other': ''
    };
    return icons[category] || '';
  };

  if (!user) {
    return (
      <div className="sell-product-container">
        <div className="auth-required">
          <h2>🔑 Authentication Required</h2>
          <p>Please login to list your products</p>
          <button onClick={() => navigate('/login')} className="login-btn">
            Login Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sell-product-container">
      <div className="sell-header">
        <h1> List Your Product</h1>
        <p>Reach thousands of potential buyers in the agricultural community</p>
      </div>

      <form onSubmit={handleSubmit} className="sell-form">
        {/* Basic Information */}
        <div className="form-section">
          <h3> Basic Information</h3>
          
          <div className="form-group">
            <label htmlFor="title">Product Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Organic Neem Fertilizer"
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
              placeholder="Describe your product in detail..."
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
                <option value="">Select Category</option>
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
          </div>
        </div>

        {/* Pricing & Quantity */}
        <div className="form-section">
          <h3> Pricing & Quantity</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price (₹) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0"
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
          <h3> Product Images</h3>
          <p className="section-desc">Upload up to 5 high-quality images of your product</p>
          
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
               Choose Images
            </label>
          </div>

          {imagePreviews.length > 0 && (
            <div className="image-previews">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="image-preview">
                  <img src={preview} alt={`Preview ${index + 1}`} />
                  <button 
                    type="button" 
                    onClick={() => removeImage(index)}
                    className="remove-image-btn"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Location */}
        <div className="form-section">
          <h3> Location</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City *</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g., Mumbai"
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
                placeholder="400001"
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
                placeholder="+91 9876543210"
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
                placeholder="your@email.com"
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
                placeholder="+91 9876543210"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/marketplace')}
            className="cancel-btn"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
          >
            {loading ? ' Listing...' : ' List Product'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SellProduct;
