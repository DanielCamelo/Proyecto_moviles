document.addEventListener('deviceready', onDeviceReady, false);
var db;

function onDeviceReady() {
    db = window.sqlitePlugin.openDatabase({ name: 'usuarios.db', location: 'default' });

    // Crea la tabla de usuarios si no existe
    db.transaction(function(tx) {
        tx.executeSql('CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY, nombre TEXT, email TEXT, username TEXT, password TEXT, telefono TEXT)');
    }, function(error) {
        console.error('Error al crear la tabla de usuarios: ' + error.message);
        showAlert('Error al crear la tabla de usuarios: ' + error.message);
    }, function() {
        console.log('Tabla de usuarios creada exitosamente.');
    });

    // Cargar usuarios al iniciar la aplicación
    cargarUsuarios();

    // Agregar evento de búsqueda al input
    var searchInput = document.querySelector('ons-search-input');
    searchInput.addEventListener('input', function(event) {
        var searchTerm = event.target.value.toLowerCase();
        filtrarUsuarios(searchTerm);
    });
}

// Función para filtrar usuarios según el término de búsqueda
function filtrarUsuarios(searchTerm) {
    var listaUsuarios = document.getElementById('listaUsuarios');
    var usuarios = listaUsuarios.getElementsByTagName('ons-list-item');

    for (var i = 0; i < usuarios.length; i++) {
        var usuarioNombre = usuarios[i].querySelector('.list-item__title').textContent.toLowerCase();
        if (usuarioNombre.includes(searchTerm)) {
            usuarios[i].style.display = 'block';
        } else {
            usuarios[i].style.display = 'none';
        }
    }
}

// Función para mostrar alertas
function showAlert(message) {
    if (navigator.notification) {
        navigator.notification.alert(message);
    } else {
        alert(message);
    }
}

// Función para crear un elemento de lista de usuario
function crearElementoUsuario(id, email) {
    var elementoUsuario = document.createElement('ons-list-item');
    elementoUsuario.innerHTML = `
    
    <div class="usuario-info">
    <span class="usuario-nombre list-item__title">${email}</span>
    <div class="botones">
        <ons-button onclick="editarUsuario(${id})">Editar</ons-button>
        <ons-button onclick="eliminarUsuario(${id})">Eliminar</ons-button>
        <ons-button onclick="detallesUsuario(${id})">Detalles</ons-button>
    </div>
</div>

    `;
    return elementoUsuario;
}

// Cargar usuarios desde la base de datos
function cargarUsuarios() {
    var listaUsuarios = document.getElementById('listaUsuarios');
    listaUsuarios.innerHTML = ''; // Limpiar la lista antes de agregar nuevos elementos

    db.transaction(function(tx) {
        tx.executeSql('SELECT * FROM usuarios', [], function(tx, res) {
            for (var i = 0; i < res.rows.length; i++) {
                var usuario = res.rows.item(i);
                var elementoUsuario = crearElementoUsuario(usuario.id, usuario.email);
                listaUsuarios.appendChild(elementoUsuario);
            }
        }, function(tx, err) {
            console.error('Error al cargar usuarios: ' + err.message);
            showAlert('Error al cargar usuarios: ' + err.message);
        });
    });
}

function Registrar() {
    var nombre = document.getElementById('nombre').value;
    var email = document.getElementById('email').value;
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    var telefono = document.getElementById('telefono').value;

    if (!nombre || !email || !username || !password || !telefono) {
        showAlert('Por favor, complete todos los campos.');
        return;
    }

    db.transaction(function(tx) {
        tx.executeSql('INSERT INTO usuarios (nombre, email, username, password, telefono) VALUES (?, ?, ?, ?, ?)', [nombre, email, username, password, telefono], function(tx, res) {
            showAlert('Usuario ' + nombre + ' insertado exitosamente.');
            window.location.href = '../index.html'; // Redirigir a la página principal
        }, function(tx, err) {
            console.error('Error al insertar usuario: ' + err.message);
            showAlert('Error al insertar usuario: ' + err.message);
        });
    });
}
// parte para editar un usuario y direccionar a la pagina de edicion
function editarUsuario(id) {
    window.location.href = 'js/editarUsuario.html?id=' + id;
}

//funcion para cargar los datos de un usuario en la pagina de edicion
function guardarCambios() {
    // Obtener el ID del usuario a editar de los parámetros de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    // Obtener los nuevos valores de los campos
    var nombre = document.getElementById('nombre').value;
    var email = document.getElementById('email').value;
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    var telefono = document.getElementById('telefono').value;

    // Construir la consulta SQL dinámicamente
    var updateQuery = 'UPDATE usuarios SET ';
    var updateData = [];
    var updateFields = [];

    // Verificar y agregar los campos que se van a actualizar
    if (nombre) {
        updateFields.push('nombre=?');
        updateData.push(nombre);
    }
    if (email) {
        updateFields.push('email=?');
        updateData.push(email);
    }
    if (username) {
        updateFields.push('username=?');
        updateData.push(username);
    }
    if (password) {
        updateFields.push('password=?');
        updateData.push(password);
    }
    if (telefono) {
        updateFields.push('telefono=?');
        updateData.push(telefono);
    }

    // Validar que al menos un campo haya sido modificado
    if (updateFields.length === 0) {
        showAlert('Seguro!!! no se modifico ningun campo.');
        return;
    }

    // Combinar los campos actualizados y ejecutar la consulta
    updateQuery += updateFields.join(', ') + ' WHERE id=?';
    updateData.push(id);

    // Actualizar los datos del usuario en la base de datos
    db.transaction(function(tx) {
        tx.executeSql(updateQuery, updateData, function(tx, res) {
            showAlert('Usuario actualizado exitosamente.');
            window.location.href = '../index.html'; // Redirigir a la página principal
        }, function(tx, err) {
            console.error('Error al actualizar usuario: ' + err.message);
            showAlert('Error al actualizar usuario: ' + err.message);
        });
    });
}

//funcion la cual muestra una alerta con toda la informacion de un usuario
function detallesUsuario(id) {
    db.transaction(function(tx) {
        tx.executeSql('SELECT * FROM usuarios WHERE id=?', [id], function(tx, res) {
            if (res.rows.length > 0) {
                var usuario = res.rows.item(0);
                var detalles = `
                    ID: ${usuario.id}
                    Nombre: ${usuario.nombre}
                    Email: ${usuario.email}
                    Username: ${usuario.username}
                    Password: ${usuario.password}
                    Teléfono: ${usuario.telefono}
                `;
                showAlert(detalles);
            } else {
                showAlert('Usuario no encontrado.');
            }
        }, function(tx, err) {
            console.error('Error al obtener detalles del usuario: ' + err.message);
            showAlert('Error al obtener detalles del usuario: ' + err.message);
        });
    });
}

// Función para eliminar un usuario
function eliminarUsuario(id) {
    db.transaction(function(tx) {
        tx.executeSql('DELETE FROM usuarios WHERE id=?', [id], function(tx, res) {
            showAlert('Usuario eliminado exitosamente.');
            cargarUsuarios();
        }, function(tx, err) {
            console.error('Error al eliminar usuario: ' + err.message);
            showAlert('Error al eliminar usuario: ' + err.message);
        });
    });
}
