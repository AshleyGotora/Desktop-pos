import bcrypt from "bcrypt";
import { CriarConta, LoginSchema, RegisterSchema } from "./schema.js";

export default async function (app) {

    // REGISTER
    app.post('/register', async (request, reply) => {
        const resultado = RegisterSchema.safeParse(request.body);

        if (!resultado.success) {
            return reply.status(400).send({ error: "Dados inválidos!" });
        }

        const { email, password, role } = resultado.data;

        try {
            const hash = await bcrypt.hash(password, 10);

            await app.db.query(
                'INSERT INTO usuarios (email, password, role) VALUES (?, ?, ?)',
                [email, hash, role]
            );

            return reply.send({ message: "Usuário criado com sucesso!" });

        } catch (error) {
            console.error(error);
            return reply.status(500).send({ error: "Erro no servidor!" });
        }
    });

    // LOGIN
    app.post('/login', async (request, reply) => {
        const resultado = LoginSchema.safeParse(request.body);

        if (!resultado.success) {
            return reply.status(400).send({ error: "Dados inválidos!" });
        }

        const { email, password } = resultado.data;

        try {
            const [rows] = await app.db.query(
                'SELECT * FROM usuarios WHERE email = ?', [email]
            );

            if (rows.length === 0) {
                return reply.status(404).send({ error: "Email ou senha incorrecta!" });
            }

            const usuario = rows[0];

            const isValid = await bcrypt.compare(password, usuario.password);
            if (!isValid) {
                return reply.status(401).send({ error: "Email ou senha incorrecta!" });
            }

            const token = app.jwt.sign(
                { id: usuario.id, email: usuario.email, role: usuario.role },
                { expiresIn: '8h' }
            );

            return reply.send({
                message: "Login feito com sucesso!",
                token,
                role: usuario.role,
                email: usuario.email
            });

        } catch (error) {
            console.error(error);
            return reply.status(500).send({ error: "Erro no servidor!" });
        }
    });

    // VERIFICAR TOKEN
    app.get('/me', {
        onRequest: [async (req, reply) => app.authenticate(req, reply)]
    }, async (request, reply) => {
        return reply.send(request.user);
    });

    app.delete('/usuario/:id', {
        onRequest: [async (req, reply) => app.authenticate(req, reply)]
    }, async (request, reply) => {
        if (request.user.role !== 'admin') {
            return reply.status(403).send({ error: "Sem permissão!" });
        }

        const { id } = request.params;

        try {
            const [rows] = await app.db.query('SELECT * FROM usuarios WHERE id = ?', [id]);

            if (rows.length === 0) {
                return reply.status(404).send({ error: "Usuário não encontrado!" });
            }

            await app.db.query('DELETE FROM usuarios WHERE id = ?', [id]);
            return reply.send({ message: "Usuário eliminado com sucesso!" });

        } catch (error) {
            console.error(error);
            return reply.status(500).send({ error: "Erro no servidor!" });
        }
    });

    app.post('/criar-conta', async (request, reply) => {
        const resultado = CriarConta.safeParse(request.body);

        if (!resultado.success) {
            return reply.status(400).send({ error: "Dados invalidos!"})
        }

        const { email, password, role } = resultado.data;

        try {
            const hash = await bcrypt.compare(password, 10); 

            app.db.query('INSERT INTO usuarios (email, password, role) VALUES (?,?,?)', [email, password, role]);

            return reply.status(200).send({ message: "Usuario inserido com sucesso!"})
        } catch (error) {
            console.error(error);
            return reply.status(500).send({ error: "Erro no servidor!"})
        }
    })
}