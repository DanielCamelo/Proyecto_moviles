document.addEventListener('deviceready', function() {
    var db = window.sqlitePlugin.openDatabase({ name: 'saveTask.db', location: 'default' });

    db.transaction(function(tx) {
        tx.executeSql('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)', [], function(tx, res) {
            console.log('Tabla de usuarios creada o verificada con éxito');
        }, function(e) {
            console.log('Error al crear/verificar la tabla de usuarios: ' + e.message);
        });

        tx.executeSql('CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT, desc TEXT, date TEXT, reminder TEXT, notes TEXT, priority TEXT, FOREIGN KEY(user_id) REFERENCES users(id))', [], function(tx, res) {
            console.log('Tabla de tareas creada o verificada con éxito');
        }, function(e) {
            console.log('Error al crear/verificar la tabla de tareas: ' + e.message);
        });
    });

    var currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        displayUsername(); // Muestra el nombre de usuario si está logueado
        loadTasks();
    } else {
        showAuthDialog();
    }

    var selectedTheme = localStorage.getItem('selectedTheme') || 'theme-light';
    document.body.className = selectedTheme;

    var selectedSound = localStorage.getItem('notificationSound') || 'default';
    document.getElementById('notification-sound').value = selectedSound;
});

function playNotificationSound() {
    var sound = localStorage.getItem('notificationSound') || 'default';
    var audio = new Audio('sounds/' + sound + '.mp3'); // Ruta relativa a la carpeta www
    audio.play();
}

function showTaskForm() {
    document.getElementById('task-dialog').show();
    document.getElementById('save-task-btn').style.display = 'block';
    document.getElementById('update-task-btn').style.display = 'none';
    document.getElementById('close-dialog-btn').style.display = 'block';
    clearTaskForm();
}

function clearTaskForm() {
    document.getElementById('task-title').value = '';
    document.getElementById('task-desc').value = '';
    document.getElementById('task-date').value = '';
    document.getElementById('task-reminder').value = '';
    document.getElementById('task-notes').value = '';
    document.getElementById('task-priority').value = 'low';
}

function closeTaskDialog() {
    document.getElementById('task-dialog').hide();
}

function saveTask() {
    var userId = localStorage.getItem('currentUser');
    var title = document.getElementById('task-title').value;
    var desc = document.getElementById('task-desc').value;
    var date = document.getElementById('task-date').value;
    var reminder = document.getElementById('task-reminder').value;
    var notes = document.getElementById('task-notes').value;
    var priority = document.getElementById('task-priority').value;

    var db = window.sqlitePlugin.openDatabase({ name: 'saveTask.db', location: 'default' });

    db.transaction(function(tx) {
        tx.executeSql('INSERT INTO tasks (user_id, title, desc, date, reminder, notes, priority) VALUES (?, ?, ?, ?, ?, ?, ?)', [userId, title, desc, date, reminder, notes, priority], function(tx, res) {
            console.log('Tarea guardada con éxito');
            playNotificationSound();
            ons.notification.toast('Tarea guardada exitosamente.', { timeout: 2000 });
            closeTaskDialog();
            loadTasks();
        }, function(e) {
            console.log('Error al guardar la tarea: ' + e.message);
        });
    });
}

function loadTasks() {
    var userId = localStorage.getItem('currentUser');
    var db = window.sqlitePlugin.openDatabase({ name: 'saveTask.db', location: 'default' });

    db.transaction(function(tx) {
        tx.executeSql('SELECT * FROM tasks WHERE user_id = ?', [userId], function(tx, res) {
            var taskList = document.getElementById('task-list');
            taskList.innerHTML = '';

            for (var i = 0; i < res.rows.length; i++) {
                var task = res.rows.item(i);
                var listItem = document.createElement('ons-list-item');
                listItem.innerHTML = `
                    <div class="center">
                        <span class="list-item-title">${task.title}</span><br>
                        <span class="list-item-desc">${task.desc}</span>
                    </div>
                    <div class="right">
                        <ons-button modifier="quiet" onclick="editTask(${task.id})">Editar</ons-button>
                        <ons-button modifier="quiet" onclick="deleteTask(${task.id})">Eliminar</ons-button>
                    </div>`;
                listItem.setAttribute('tappable', '');
                taskList.appendChild(listItem);
            }
        }, function(e) {
            console.log('Error al cargar las tareas: ' + e.message);
        });
    });
}

function editTask(taskId) {
    var db = window.sqlitePlugin.openDatabase({ name: 'saveTask.db', location: 'default' });

    db.transaction(function(tx) {
        tx.executeSql('SELECT * FROM tasks WHERE id = ?', [taskId], function(tx, res) {
            if (res.rows.length > 0) {
                var task = res.rows.item(0);
                document.getElementById('task-title').value = task.title;
                document.getElementById('task-desc').value = task.desc;
                document.getElementById('task-date').value = task.date;
                document.getElementById('task-reminder').value = task.reminder;
                document.getElementById('task-notes').value = task.notes;
                document.getElementById('task-priority').value = task.priority;

                document.getElementById('save-task-btn').style.display = 'none';
                document.getElementById('update-task-btn').style.display = 'block';
                document.getElementById('close-dialog-btn').style.display = 'block';
                document.getElementById('update-task-btn').onclick = function() {
                    updateTask(task.id);
                };
                document.getElementById('task-dialog').show();
            }
        }, function(e) {
            console.log('Error al cargar los detalles de la tarea: ' + e.message);
        });
    });
}

function updateTask(taskId) {
    var title = document.getElementById('task-title').value;
    var desc = document.getElementById('task-desc').value;
    var date = document.getElementById('task-date').value;
    var reminder = document.getElementById('task-reminder').value;
    var notes = document.getElementById('task-notes').value;
    var priority = document.getElementById('task-priority').value;

    var db = window.sqlitePlugin.openDatabase({ name: 'saveTask.db', location: 'default' });

    db.transaction(function(tx) {
        tx.executeSql('UPDATE tasks SET title = ?, desc = ?, date = ?, reminder = ?, notes = ?, priority = ? WHERE id = ?', [title, desc, date, reminder, notes, priority, taskId], function(tx, res) {
            console.log('Tarea actualizada con éxito');
            playNotificationSound();
            ons.notification.toast('Tarea actualizada exitosamente.', { timeout: 2000 });
            closeTaskDialog();
            loadTasks();
        }, function(e) {
            console.log('Error al actualizar la tarea: ' + e.message);
        });
    });
}

function deleteTask(taskId) {
    var db = window.sqlitePlugin.openDatabase({ name: 'saveTask.db', location: 'default' });

    db.transaction(function(tx) {
        tx.executeSql('DELETE FROM tasks WHERE id = ?', [taskId], function(tx, res) {
            console.log('Tarea eliminada con éxito');
            playNotificationSound();
            ons.notification.toast('Tarea eliminada exitosamente.', { timeout: 2000 });
            loadTasks();
        }, function(e) {
            console.log('Error al eliminar la tarea: ' + e.message);
        });
    });
}

function showAuthDialog() {
    document.getElementById('auth-dialog').show();
}

function closeAuthDialog() {
    document.getElementById('auth-dialog').hide();
}