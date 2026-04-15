const state = {
  personas: [],
  roles: [],
  personasRoles: [],
  usuarios: [],
  cuentas: [],
  tiposCuenta: [],
  transacciones: [],
  tiposTransaccion: [],
  destinatarios: [],
  auditoria: [],
  selectedPersonaId: null,
};

const API_BASE_URL = (window.BANCO_API_URL || 'http://localhost:3000').replace(/\/$/, '');

const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const $ = (selector) => document.querySelector(selector);

async function apiGet(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Error al consultar ${path}`);
  }
  return response.json();
}

function sumBalances(cuentas) {
  return cuentas.reduce((acc, cuenta) => acc + Number(cuenta.saldo || 0), 0);
}

function getRolesByPersona(personaId) {
  const rolIds = state.personasRoles.filter((item) => item.persona_id === personaId).map((item) => item.rol_id);
  return state.roles.filter((role) => rolIds.includes(role.id));
}

function getPersonaName(personaId) {
  const persona = state.personas.find((item) => item.id === personaId);
  return persona ? `${persona.nombre} ${persona.apellido}` : 'Sin titular';
}

function getTipoCuentaName(tipoCuentaId) {
  return state.tiposCuenta.find((item) => item.id === tipoCuentaId)?.nombre || 'Tipo desconocido';
}

function getTipoTransaccionName(tipoId) {
  return state.tiposTransaccion.find((item) => item.id === tipoId)?.nombre || 'Movimiento';
}

function shortId(value = '') {
  return value.slice(0, 8);
}

function getStatusClass(status) {
  if (status === 'completada' || status === true) return 'status-ok';
  if (status === 'rechazada' || status === false) return 'status-alert';
  return 'status-pending';
}

function getInitials(nombre = '', apellido = '') {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

function getPersonaTransactions(accountIds) {
  return state.transacciones
    .filter(
      (item) => accountIds.includes(item.cuenta_origen_id) || (item.cuenta_destino_id && accountIds.includes(item.cuenta_destino_id))
    )
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

function renderMetrics() {
  const statsGrid = $('#stats-grid');
  const heroMetrics = $('#hero-metrics');
  const template = $('#metric-template');

  const cuentasActivas = state.cuentas.filter((cuenta) => cuenta.activa).length;
  const transaccionesCompletadas = state.transacciones.filter(
    (transaccion) => transaccion.estado === 'completada'
  ).length;
  const saldoTotal = sumBalances(state.cuentas);
  const auditoriasHoy = state.auditoria.filter((item) => {
    if (!item.created_at) return false;
    return new Date(item.created_at).toDateString() === new Date().toDateString();
  }).length;

  const metrics = [
    ['Clientes', String(state.personas.length), 'Base de personas registradas'],
    ['Cuentas activas', String(cuentasActivas), `${state.cuentas.length} cuentas totales`],
    ['Saldo agregado', currency.format(saldoTotal), 'Visión consolidada de fondos'],
    ['Auditoría hoy', String(auditoriasHoy), 'Eventos trazados en la jornada'],
  ];

  statsGrid.innerHTML = '';
  heroMetrics.innerHTML = '';

  metrics.forEach(([label, value, caption], index) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector('.metric-label').textContent = label;
    node.querySelector('.metric-value').textContent = value;
    node.querySelector('.metric-caption').textContent = caption;

    if (index < 2) {
      heroMetrics.appendChild(node);
    } else {
      statsGrid.appendChild(node);
    }
  });

  const extraMetrics = [
    ['Movimientos cerrados', String(transaccionesCompletadas), 'Transacciones completadas'],
    [
      'Confianza operativa',
      `${state.usuarios.filter((usuario) => usuario.activo).length} usuarios activos`,
      'Usuarios habilitados para operar',
    ],
  ];

  extraMetrics.forEach(([label, value, caption]) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector('.metric-label').textContent = label;
    node.querySelector('.metric-value').textContent = value;
    node.querySelector('.metric-caption').textContent = caption;
    heroMetrics.appendChild(node);
  });
}

function renderPersonas() {
  const container = $('#personas-list');

  if (!state.personas.length) {
    container.innerHTML = '<div class="empty-state">Todavía no hay personas cargadas.</div>';
    return;
  }

  container.innerHTML = state.personas
    .map((persona) => {
      const roles = getRolesByPersona(persona.id);
      const activeAccounts = state.cuentas.filter((cuenta) => cuenta.persona_id === persona.id && cuenta.activa).length;

      return `
        <article class="person-card ${state.selectedPersonaId === persona.id ? 'active' : ''}" data-persona-id="${persona.id}">
          <p class="eyebrow">Cliente</p>
          <h4>${persona.nombre} ${persona.apellido}</h4>
          <p class="person-meta">${persona.email}<br />DNI ${persona.dni}</p>
          <p class="small-note">${activeAccounts} cuenta(s) activa(s)</p>
          <div class="person-tags">
            ${(roles.length ? roles : [{ nombre: 'Sin rol asignado' }])
              .map((rol) => `<span class="tag">${rol.nombre}</span>`)
              .join('')}
          </div>
        </article>
      `;
    })
    .join('');

  container.querySelectorAll('[data-persona-id]').forEach((card) => {
    card.addEventListener('click', () => loadPersonaDetail(card.dataset.personaId));
  });
}

async function loadPersonaDetail(personaId) {
  state.selectedPersonaId = personaId;
  renderPersonas();

  const container = $('#persona-detail');
  container.classList.remove('empty-state');
  container.innerHTML = '<div class="small-note">Cargando perfil consolidado...</div>';

  try {
    const payload = await apiGet(`/api/personas/${personaId}/full`);
    const cuentas = payload.cuentas || [];
    const roles = payload.roles || [];
    const destinatarios = payload.destinatarios || [];
    const accountIds = cuentas.map((cuenta) => cuenta.id);
    const movimientos = getPersonaTransactions(accountIds).slice(0, 4);
    const saldoTotal = cuentas.reduce((acc, cuenta) => acc + Number(cuenta.saldo || 0), 0);
    const cuentasActivas = cuentas.filter((cuenta) => cuenta.activa).length;
    const edad = payload.persona.fecha_nacimiento
      ? Math.floor((Date.now() - new Date(payload.persona.fecha_nacimiento).getTime()) / 31557600000)
      : null;

    container.innerHTML = `
      <div class="detail-block">
        <div class="detail-hero">
          <div class="detail-avatar">${getInitials(payload.persona.nombre, payload.persona.apellido)}</div>
          <div>
            <p class="eyebrow">Perfil</p>
            <h4 class="detail-title">${payload.persona.nombre} ${payload.persona.apellido}</h4>
            <p class="person-meta">
              ${payload.persona.email}<br />
              ${payload.persona.telefono || 'Sin teléfono'}<br />
              DNI ${payload.persona.dni}${edad ? ` · ${edad} años` : ''}
            </p>
          </div>
        </div>
        <div class="detail-tags">
          ${(roles.length ? roles : [{ nombre: 'Sin roles' }]).map((rol) => `<span class="tag">${rol.nombre}</span>`).join('')}
        </div>
        <div class="detail-summary-grid">
          <div class="summary-tile">
            <span class="summary-label">Saldo total</span>
            <strong>${currency.format(saldoTotal)}</strong>
          </div>
          <div class="summary-tile">
            <span class="summary-label">Cuentas activas</span>
            <strong>${cuentasActivas} / ${cuentas.length || 0}</strong>
          </div>
          <div class="summary-tile">
            <span class="summary-label">Destinatarios</span>
            <strong>${destinatarios.length}</strong>
          </div>
          <div class="summary-tile">
            <span class="summary-label">Estado digital</span>
            <strong>${payload.usuario?.activo ? 'Operativo' : 'Limitado'}</strong>
          </div>
        </div>
      </div>
      <div class="detail-block">
        <p class="eyebrow">Usuario</p>
        ${
          payload.usuario
            ? `<div class="detail-item">
                <strong>${payload.usuario.clerk_id}</strong>
                <div class="small-note">Alta ${payload.usuario.created_at ? dateFormatter.format(new Date(payload.usuario.created_at)) : '-'}</div>
                <span class="status-badge ${getStatusClass(payload.usuario.activo)}">
                  ${payload.usuario.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>`
            : '<p class="small-note">No tiene usuario asociado.</p>'
        }
      </div>
      <div class="detail-block">
        <p class="eyebrow">Cuentas</p>
        <div class="detail-list">
          ${
            cuentas.length
              ? cuentas
                  .map(
                    (cuenta) => `
                      <div class="detail-item">
                        <strong>${cuenta.tipo_cuenta_nombre} · ${cuenta.numero_cuenta}</strong>
                        <div class="small-note">CBU ${cuenta.cbu}</div>
                        <div class="amount">${currency.format(Number(cuenta.saldo || 0))}</div>
                      </div>
                    `
                  )
                  .join('')
              : '<p class="small-note">No hay cuentas asociadas.</p>'
          }
        </div>
      </div>
      <div class="detail-block">
        <p class="eyebrow">Actividad reciente</p>
        <div class="detail-list">
          ${
            movimientos.length
              ? movimientos
                  .map(
                    (movimiento) => `
                      <div class="detail-item">
                        <strong>${getTipoTransaccionName(movimiento.tipo_transaccion_id)} · ${currency.format(Number(movimiento.monto || 0))}</strong>
                        <div class="small-note">${movimiento.descripcion || 'Sin descripción'}</div>
                        <div class="detail-inline">
                          <span class="status-badge ${getStatusClass(movimiento.estado)}">${movimiento.estado}</span>
                          <span class="small-note">${movimiento.created_at ? dateFormatter.format(new Date(movimiento.created_at)) : '-'}</span>
                        </div>
                      </div>
                    `
                  )
                  .join('')
              : '<p class="small-note">No hay movimientos recientes vinculados a sus cuentas.</p>'
          }
        </div>
      </div>
      <div class="detail-block">
        <p class="eyebrow">Destinatarios</p>
        <div class="detail-list">
          ${
            destinatarios.length
              ? destinatarios
                  .map(
                    (item) => `
                      <div class="detail-item">
                        <strong>${item.alias || 'Sin alias'}</strong>
                        <div class="small-note">${item.banco_externo || 'Banco no informado'}</div>
                        <div class="small-note">CBU ${item.cbu_externo}</div>
                      </div>
                    `
                  )
                  .join('')
              : '<p class="small-note">No tiene destinatarios guardados.</p>'
          }
        </div>
      </div>
    `;
  } catch (error) {
    container.classList.add('empty-state');
    container.textContent = 'No se pudo cargar el perfil consolidado.';
  }
}

function renderCuentas() {
  const container = $('#cuentas-table');

  if (!state.cuentas.length) {
    container.innerHTML = '<div class="empty-state">Todavía no hay cuentas registradas.</div>';
    return;
  }

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Titular</th>
          <th>Tipo</th>
          <th>Número</th>
          <th>Saldo</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        ${state.cuentas
          .slice(0, 12)
          .map(
            (cuenta) => `
              <tr>
                <td>${getPersonaName(cuenta.persona_id)}</td>
                <td>${getTipoCuentaName(cuenta.tipo_cuenta_id)}</td>
                <td>${cuenta.numero_cuenta}</td>
                <td class="amount">${currency.format(Number(cuenta.saldo || 0))}</td>
                <td>
                  <span class="status-badge ${getStatusClass(cuenta.activa)}">
                    ${cuenta.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
              </tr>
            `
          )
          .join('')}
      </tbody>
    </table>
  `;
}

function renderDestinatarios() {
  const container = $('#destinatarios-list');

  if (!state.destinatarios.length) {
    container.innerHTML = '<div class="empty-state">No hay destinatarios cargados.</div>';
    return;
  }

  container.innerHTML = state.destinatarios
    .slice(0, 8)
    .map(
      (item) => `
        <article class="stack-item">
          <strong>${item.alias || 'Sin alias'}</strong>
          <div class="stack-meta">${getPersonaName(item.persona_id)}</div>
          <div class="stack-meta">${item.banco_externo || 'Banco externo no informado'}</div>
          <div class="small-note">CBU ${item.cbu_externo}</div>
        </article>
      `
    )
    .join('');
}

function renderTransacciones() {
  const container = $('#transacciones-table');

  if (!state.transacciones.length) {
    container.innerHTML = '<div class="empty-state">No hay transacciones registradas.</div>';
    return;
  }

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Origen</th>
          <th>Destino</th>
          <th>Monto</th>
          <th>Estado</th>
          <th>Fecha</th>
        </tr>
      </thead>
      <tbody>
        ${state.transacciones
          .slice(0, 12)
          .map(
            (item) => `
              <tr>
                <td>${getTipoTransaccionName(item.tipo_transaccion_id)}</td>
                <td>${shortId(item.cuenta_origen_id)}</td>
                <td>${item.cuenta_destino_id ? shortId(item.cuenta_destino_id) : 'Externo'}</td>
                <td class="amount">${currency.format(Number(item.monto || 0))}</td>
                <td><span class="status-badge ${getStatusClass(item.estado)}">${item.estado}</span></td>
                <td>${item.created_at ? dateFormatter.format(new Date(item.created_at)) : '-'}</td>
              </tr>
            `
          )
          .join('')}
      </tbody>
    </table>
  `;
}

function renderAuditoria() {
  const container = $('#auditoria-list');

  if (!state.auditoria.length) {
    container.innerHTML = '<div class="empty-state">No hay eventos de auditoría.</div>';
    return;
  }

  container.innerHTML = state.auditoria
    .slice(0, 8)
    .map(
      (item) => `
        <article class="timeline-item">
          <strong>${item.accion} · ${item.entidad}</strong>
          <div class="timeline-meta">Usuario ${shortId(item.usuario_id)}</div>
          <div class="timeline-meta">${item.created_at ? dateFormatter.format(new Date(item.created_at)) : '-'}</div>
        </article>
      `
    )
    .join('');
}

function setApiStatus(message, ok = true) {
  $('#api-status').textContent = message;
  $('.status-dot').style.background = ok ? 'var(--success)' : 'var(--danger)';
  $('.status-dot').style.boxShadow = ok
    ? '0 0 0 6px rgba(47, 125, 87, 0.12)'
    : '0 0 0 6px rgba(180, 79, 70, 0.12)';
}

async function loadDashboard() {
  setApiStatus('Sincronizando datos');

  try {
    const [
      personas,
      roles,
      personasRoles,
      usuarios,
      cuentas,
      tiposCuenta,
      transacciones,
      tiposTransaccion,
      destinatarios,
      auditoria,
    ] = await Promise.all([
      apiGet('/api/personas?limit=100'),
      apiGet('/api/roles?limit=100'),
      apiGet('/api/personas-roles?limit=100'),
      apiGet('/api/usuarios?limit=100'),
      apiGet('/api/cuentas?limit=100'),
      apiGet('/api/tipos-cuenta?limit=100'),
      apiGet('/api/transacciones?limit=100'),
      apiGet('/api/tipos-transaccion?limit=100'),
      apiGet('/api/destinatarios?limit=100'),
      apiGet('/api/auditoria?limit=100'),
    ]);

    state.personas = personas.data;
    state.roles = roles.data;
    state.personasRoles = personasRoles.data;
    state.usuarios = usuarios.data;
    state.cuentas = cuentas.data;
    state.tiposCuenta = tiposCuenta.data;
    state.transacciones = transacciones.data;
    state.tiposTransaccion = tiposTransaccion.data;
    state.destinatarios = destinatarios.data;
    state.auditoria = auditoria.data;
    state.selectedPersonaId = state.selectedPersonaId || state.personas[0]?.id || null;

    renderMetrics();
    renderPersonas();
    renderCuentas();
    renderDestinatarios();
    renderTransacciones();
    renderAuditoria();

    if (state.selectedPersonaId) {
      await loadPersonaDetail(state.selectedPersonaId);
    }

    setApiStatus('API conectada y datos actualizados');
  } catch (error) {
    console.error(error);
    setApiStatus('No se pudo conectar con la API', false);
    $('#stats-grid').innerHTML =
      '<div class="empty-state panel">No se pudieron cargar los datos. Verificá que el backend esté levantado.</div>';
  }
}

$('#refresh-button').addEventListener('click', loadDashboard);

loadDashboard();
