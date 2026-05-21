import React from 'react';

const teamMembers = [
  { id: 1, name: 'Илья Роднов', role: 'Frontend Developer' },
  { id: 3, name: 'Илья Роднов', role: 'Backend Developer' },
];

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
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 1.5rem',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    marginTop: '1rem',
    backgroundColor: '#f9f9fb',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#7c83fd',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '1.2rem',
    flexShrink: 0,
  },
  role: {
    color: '#666',
    fontSize: '0.9rem',
    margin: '0.2rem 0 0',
  },
};

function About() {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>👥 О нас</h1>
      <p>
        Этот компонент загружен <strong>лениво</strong> (lazy loading).
        Он не входил в начальный бандл и был запрошен браузером
        только при переходе на эту страницу.
      </p>

      <h2>Наша команда</h2>
      {teamMembers.map(({ id, name, role }) => (
        <div key={id} style={styles.card}>
          <div style={styles.avatar}>{name[0]}</div>
          <div>
            <strong>{name}</strong>
            <p style={styles.role}>{role}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default About;