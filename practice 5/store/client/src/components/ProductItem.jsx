import React from 'react';

export default function ProductItem({ product, onEdit, onDelete }) {
  const imageUrl = product.image ? `http://localhost:3000${product.image}` : null;

  return (
    <div className="productRow">
      <div className="productMain">
        {imageUrl && (
          <img src={imageUrl} alt={product.name} className="productImage" onError={(e) => { e.target.style.display = 'none'; }} />
        )}
        <span className="productId">{product.id}</span>
        <span className="productName">{product.name}</span>
        <span className="productCategory">{product.category}</span>
        <span className="productPrice">{product.price} ₽</span>
        <span className="productStock">склад: {product.stock}</span>
      </div>
      <div className="productActions">
        <button className="btn" onClick={() => onEdit(product)}>✎</button>
        <button className="btn btn--danger" onClick={() => onDelete(product.id)}>✕</button>
      </div>
    </div>
  );
}