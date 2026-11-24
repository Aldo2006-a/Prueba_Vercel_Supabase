// website/controllers.js
import { authenticate } from '../admin/services/auth_services.js';

export function home(req, res) { 
  return res.render('website/home', {
    title: 'Crear cuenta :)',
    currentPage: 'home',
    log_in_out: esta_logeado(req),
    description:
      'Esta es una aplicación de ejemplo creada con Node.js, Express y EJS.'
  });
}

export function login(req, res) { 
  res.render('website/login', {
    title: 'Login',
    log_in_out: esta_logeado(req),
  });
}

export function registrarLocal(req, res) { 
  return res.render('website/registrarLocal', {
    title: 'registrarLocal',
    log_in_out: esta_logeado(req),
  });
}

export function comoFunciona(req, res) { 
  return res.render('website/comoFunciona', {
    title: 'comoFunciona',
    log_in_out: esta_logeado(req),
  });
}
export function locales(req, res) { 
  res.render('website/locales', {
    title: 'locales',
    log_in_out: esta_logeado(req),
  });
}

export function detalleLocal(req, res) {
  const localId = parseInt(req.params.id, 10);
  
  res.render('website/local', {
    title: 'Detalle del Local',
    localId: localId,
    log_in_out: esta_logeado(req)
  });
}
export function register(req, res) { 
  res.render('website/register', {
    title: 'register',
  });
}

export function logout(req, res) {
  req.session.destroy(err => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
      return res.redirect('/');
    }

    // Limpia la cookie de sesión (opcional pero recomendado)
    res.clearCookie('connect.sid');

    // Redirige al login
    res.redirect('/sign-in');
  });
}

export async function ingresar(req, res) {
  const { correo, password } = req.body;

  const renderError = (mensaje) =>
    res.render('website/login', {
      title: 'Login',
      mensaje,
      error: mensaje,
      correoIngresado: correo,
      log_in_out: esta_logeado(req)
    });

  let resultado;
  try {
    resultado = await authenticate(correo, password);
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    return renderError('No se pudo iniciar sesión. Intenta de nuevo.');
  }

  if (!resultado.ok) {
    if (resultado.reason === 'ACCOUNT_BLOCKED') {
      return renderError('Tu cuenta está bloqueada o suspendida.');
    }
    return renderError('Correo o contraseña incorrectos. Te quedan 4 intentos.');
  }

  const { user } = resultado;
  req.session.correo = user.email;
  req.session.role = user.role;
  req.session.user = user;

  return req.session.save(() => {
    if (user.role === 'enterprises') return res.redirect('/enterprises');
    if (user.role === 'owner') return res.redirect('/owner');
    if (user.role === 'comensal' || user.role === 'comensales') {
      return res.redirect('/comensales');
    }
    return res.redirect('/');
  });
}
function esta_logeado(req) {
  const isAuthenticated = req.session && req.session.correo && req.session.role;
  let b = 'Cerrar sesión';
  if (!isAuthenticated) {
    req.session.role = null;
    b = 'Iniciar sesión';
  }
  return b;
}

export const RecuperarContrasena = (req, res) => {
  res.render('website/RecuperarContrasena');
};

export function Home_Cerrar_ses(req, res) {
  const isAuthenticated = req.session && req.session.correo && req.session.role;
  if (isAuthenticated){
    req.session.destroy((err) => {
      if (err) {
        console.error('Error al cerrar sesión:', err);
        return res.status(500).send('No se pudo cerrar la sesión');
      }
      res.clearCookie('connect.sid'); // nombre por defecto de la cookie
      res.redirect('/');
    });
  }else{
    res.redirect('/login');
  }
}
