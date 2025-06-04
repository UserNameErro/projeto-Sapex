// Configurações do banco de dados
const DB_CONFIG = {
    name: 'arkadai_login',
    version: '1.0',
    description: 'Banco de dados de login ARKAD AI',
    size: 2 * 1024 * 1024, // 2MB
    tables: {
        usuarios: {
            name: 'usuarios',
            columns: {
                id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
                email: 'TEXT UNIQUE NOT NULL',
                senha: 'TEXT NOT NULL',
                nome: 'TEXT',
                data_criacao: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
                ultimo_login: 'DATETIME',
                status: 'TEXT DEFAULT "ativo"',
                tipo_conta: 'TEXT DEFAULT "usuario"'
            }
        },
        tentativas_login: {
            name: 'tentativas_login',
            columns: {
                id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
                email: 'TEXT NOT NULL',
                data_tentativa: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
                ip: 'TEXT',
                status: 'TEXT'
            }
        }
    }
};

// Configurações de segurança
const SECURITY_CONFIG = {
    maxTentativasLogin: 5,
    tempoBloqueio: 30 * 60 * 1000, // 30 minutos em milissegundos
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas em milissegundos
    passwordMinLength: 8,
    passwordRequirements: {
        uppercase: true,
        lowercase: true,
        numbers: true,
        specialChars: true
    }
};

// Configurações de mensagens
const MESSAGES = {
    login: {
        success: 'Login realizado com sucesso!',
        error: 'E-mail ou senha incorretos',
        blocked: 'Conta bloqueada por excesso de tentativas. Tente novamente mais tarde.',
        invalidEmail: 'E-mail inválido',
        invalidPassword: 'Senha inválida'
    },
    cadastro: {
        success: 'Cadastro realizado com sucesso!',
        error: 'Erro ao realizar cadastro. Tente novamente.',
        emailExists: 'Este e-mail já está cadastrado',
        passwordRequirements: 'A senha deve conter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais'
    }
};

// Exportar configurações
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DB_CONFIG,
        SECURITY_CONFIG,
        MESSAGES
    };
} 