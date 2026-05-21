import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const styles = {
  nav: {
    display: 'flex',
    gap: '1.5rem',
    padding: '1rem 2rem',
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
  },
  link: {
    color: '#e0e0e0',
    textDecoration: 'none',
    fontSize: '1rem',
    fontWeight: '500',
  },
  activeLink: {
    color: '#7c83fd',
    textDecoration: 'underline',
  },
  title: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '1.2rem',
    marginRight: 'auto',
  },
};

function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav style={styles.nav}>
      <span style={styles.title}>⚡ My App</span>
      <Link to="/" style={pathname === '/' ? styles.activeLink : styles.link}>
        Главная
      </Link>
      <Link to="/about" style={pathname === '/about' ? styles.activeLink : styles.link}>
        О нас
      </Link>
    </nav>
  );
}

export default Navbar;