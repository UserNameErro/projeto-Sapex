// Importar configurações
let DB_CONFIG, SECURITY_CONFIG, MESSAGES;

// Carregar configurações
fetch('../js/config.js')
    .then(response => response.text())
    .then(text => {
        // Executar o código do config.js
        eval(text);
        // Inicializar o banco de dados após carregar as configurações
        initDatabase();
    })
    .catch(error => console.error('Erro ao carregar configurações:', error));

// Função para inicializar o banco de dados
function initDatabase() {
    const db = openDatabase(
        'arkadai_login',
        '1.0',
        'Banco de dados de login ARKAD AI',
        2 * 1024 * 1024
    );
    
    db.transaction(function(tx) {
        // Criar tabela de usuários
        tx.executeSql(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                senha TEXT NOT NULL,
                nome TEXT,
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
                ultimo_login DATETIME,
                status TEXT DEFAULT "ativo",
                tipo_conta TEXT DEFAULT "usuario"
            )
        `);

        // Criar tabela de tentativas de login
        tx.executeSql(`
            CREATE TABLE IF NOT EXISTS tentativas_login (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                data_tentativa DATETIME DEFAULT CURRENT_TIMESTAMP,
                ip TEXT,
                status TEXT
            )
        `);
    });

    return db;
}

// Função para validar senha
function validarSenha(senha) {
    if (senha.length < 8) return false;
    if (!/[A-Z]/.test(senha)) return false;
    if (!/[a-z]/.test(senha)) return false;
    if (!/[0-9]/.test(senha)) return false;
    if (!/[!@#$%^&*]/.test(senha)) return false;
    return true;
}

// Função para verificar tentativas de login
function verificarTentativasLogin(email) {
    return new Promise((resolve, reject) => {
        const db = initDatabase();
        
        db.transaction(function(tx) {
            tx.executeSql(
                'SELECT COUNT(*) as count FROM tentativas_login WHERE email = ? AND data_tentativa > datetime("now", "-30 minutes")',
                [email],
                function(tx, results) {
                    resolve(results.rows.item(0).count);
                },
                function(tx, error) {
                    reject(error);
                }
            );
        });
    });
}

// Função para registrar tentativa de login
function registrarTentativaLogin(email, status) {
    const db = initDatabase();
    
    db.transaction(function(tx) {
        tx.executeSql(
            'INSERT INTO tentativas_login (email, status) VALUES (?, ?)',
            [email, status]
        );
    });
}

// Função para verificar se o usuário existe
async function verificarUsuario(email, senha) {
    const tentativas = await verificarTentativasLogin(email);
    
    if (tentativas >= 5) {
        throw new Error('Conta bloqueada por excesso de tentativas. Tente novamente mais tarde.');
    }

    return new Promise((resolve, reject) => {
        const db = initDatabase();
        
        db.transaction(function(tx) {
            tx.executeSql(
                'SELECT * FROM usuarios WHERE email = ? AND senha = ?',
                [email, senha],
                function(tx, results) {
                    if (results.rows.length > 0) {
                        // Atualizar último login
                        tx.executeSql(
                            'UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE email = ?',
                            [email]
                        );
                        registrarTentativaLogin(email, 'sucesso');
                        resolve(true);
                    } else {
                        registrarTentativaLogin(email, 'falha');
                        resolve(false);
                    }
                },
                function(tx, error) {
                    reject(error);
                }
            );
        });
    });
}

// Função para cadastrar novo usuário
async function cadastrarUsuario(email, senha, nome) {
    if (!validarSenha(senha)) {
        throw new Error('A senha deve conter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais');
    }

    return new Promise((resolve, reject) => {
        const db = initDatabase();
        
        // Primeiro, verificar se o email já existe
        db.transaction(function(tx) {
            tx.executeSql(
                'SELECT COUNT(*) as count FROM usuarios WHERE email = ?',
                [email],
                function(tx, results) {
                    if (results.rows.item(0).count > 0) {
                        reject(new Error('Este e-mail já está cadastrado'));
                        return;
                    }

                    // Se o email não existe, prosseguir com o cadastro
                    tx.executeSql(
                        'INSERT INTO usuarios (email, senha, nome) VALUES (?, ?, ?)',
                        [email, senha, nome],
                        function(tx, results) {
                            resolve(true);
                        },
                        function(tx, error) {
                            console.error('Erro no cadastro:', error);
                            reject(new Error('Erro ao realizar cadastro. Tente novamente.'));
                        }
                    );
                },
                function(tx, error) {
                    console.error('Erro ao verificar email:', error);
                    reject(new Error('Erro ao verificar email. Tente novamente.'));
                }
            );
        });
    });
}

// Função para lidar com o login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const senha = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
    
    try {
        const usuarioExiste = await verificarUsuario(email, senha);
        
        if (usuarioExiste) {
            successMessage.textContent = 'Login realizado com sucesso!';
            successMessage.style.display = 'block';
            
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('loginTime', Date.now());
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            errorMessage.textContent = 'E-mail ou senha incorretos';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Erro ao verificar login:', error);
        errorMessage.textContent = error.message || 'Erro ao realizar login. Tente novamente.';
        errorMessage.style.display = 'block';
    }
    
    return false;
}

// Inicializar o banco de dados quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    initDatabase();
});

// Verifica se o usuário já está logado
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const loginTime = localStorage.getItem('loginTime');
    
    if (isLoggedIn === 'true' && loginTime) {
        const currentTime = Date.now();
        const timeDiff = currentTime - parseInt(loginTime);
        
        if (timeDiff < 24 * 60 * 60 * 1000) { // 24 horas
            window.location.href = 'index.html';
        } else {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('loginTime');
        }
    }
}

// Verifica o status do login quando a página carrega
document.addEventListener('DOMContentLoaded', checkLoginStatus); 