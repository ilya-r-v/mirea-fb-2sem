import React from 'react';

export function formatDate(date) {
  return new Intl.DateTimeFormat('ru-RU').format(date);
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(amount);
}

const styles = {
  container: {
    maxWidth: '700px',
    margin: '3rem auto',
    padding: '0 1.5rem',
    fontFamily: 'sans-serif',
  },
  heading: {
    fontSize: '2rem',
    color: '#1a1a2e',
  },
  badge: {
    display: 'inline-block',
    backgroundColor: '#7c83fd',
    color: '#fff',
    borderRadius: '4px',
    padding: '0.2rem 0.6rem',
    fontSize: '0.85rem',
    marginRight: '0.5rem',
  },
  card: {
    marginTop: '2rem',
    padding: '1.5rem',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#f9f9fb',
  },
};

function Home() {
  const today = formatDate(new Date());

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Главная страница</h1>
      <p>Сегодня: <strong>{today}</strong></p>

      <div style={styles.card}>
        <h2>Оптимизации в этом проекте</h2>
        <ul>
          <li><span style={styles.badge}>Lazy Loading</span> страница «О нас» загружается по требованию</li>
          <li><span style={styles.badge}>Code Splitting</span> vendor, router и app — отдельные чанки</li>
          <li><span style={styles.badge}>Tree-shaking</span> неиспользуемые функции удаляются из бандла</li>
          <li><span style={styles.badge}>Хэширование</span> имена файлов содержат хэш содержимого</li>
          <li><span style={styles.badge}>Visualizer</span> после <code>npm run build</code> открывается bundle-report.html</li>
        </ul>
      </div>
    </div>
  );
}

export default Home;