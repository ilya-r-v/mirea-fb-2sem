import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function ProductModal({
  open,
  mode,
  initialProduct,
  onClose,
  onSubmit
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (initialProduct) {
      setName(initialProduct.name || '');
      setCategory(initialProduct.category || '');
      setDescription(initialProduct.description || '');
      setPrice(initialProduct.price != null ? String(initialProduct.price) : '');
      setStock(initialProduct.stock != null ? String(initialProduct.stock) : '');
      setImagePath(initialProduct.image || '');
      setPreview(null);
    } else {
      setName('');
      setCategory('');
      setDescription('');
      setPrice('');
      setStock('');
      setImagePath('');
      setPreview(null);
    }
  }, [open, initialProduct]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const { path } = await api.uploadImage(file);
      setImagePath(path);
    } catch (err) {
      console.error(err);
      alert('Ошибка загрузки изображения');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (imagePath) {
      try {
        await api.deleteImage(imagePath);
      } catch (err) {
        console.error(err);
      }
    }
    setImagePath('');
    setPreview(null);
    const fileInput = document.getElementById('image-upload');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const trimmedDesc = description.trim();
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);

    if (!trimmedName || !trimmedCategory || !trimmedDesc) {
      alert('Заполните название, категорию и описание');
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      alert('Введите корректную цену (положительное число)');
      return;
    }
    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      alert('Введите корректное количество на складе (целое неотрицательное число)');
      return;
    }

    onSubmit({
      id: initialProduct?.id,
      name: trimmedName,
      category: trimmedCategory,
      description: trimmedDesc,
      price: parsedPrice,
      stock: parsedStock,
      image: imagePath || null
    });
  };

  if (!open) return null;

  const title = mode === 'edit' ? 'Редактирование товара' : 'Создание товара';

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal__header">
          <div className="modal__title">{title}</div>
          <button className="iconBtn" onClick={onClose} aria-label="Закрыть">✕</button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            Название *
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Классическая футболка" autoFocus required />
          </label>

          <label className="label">
            Категория *
            <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Футболки" required />
          </label>

          <label className="label">
            Описание *
            <textarea className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Краткое описание товара" rows="3" required />
          </label>

          <div style={{ display: 'flex', gap: '10px' }}>
            <label className="label" style={{ flex: 1 }}>
              Цена (₽) *
              <input className="input" type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1290" required />
            </label>
            <label className="label" style={{ flex: 1 }}>
              Количество на складе *
              <input className="input" type="number" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="25" required />
            </label>
          </div>

          <div className="label">
            <span>Изображение товара</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
              <input id="image-upload" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileChange} disabled={uploading} />
              {uploading && <span>Загрузка...</span>}
            </div>

            {(preview || imagePath) && (
              <div style={{ marginTop: '10px', position: 'relative', display: 'inline-block' }}>
                <img src={preview || (imagePath ? `http://localhost:3000${imagePath}` : '')} alt="Preview" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px' }} />
                <button type="button" onClick={handleRemoveImage} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}>✕</button>
              </div>
            )}
          </div>

          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn--primary" disabled={uploading}>
              {mode === 'edit' ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}