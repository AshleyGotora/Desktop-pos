import { v2 as cloudinary } from "cloudinary";
import multipart from "@fastify/multipart";
import "dotenv/config";
import { EditarProduto, ProdutosSchema } from "./schema.js";

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

export default async function(app) {
    await app.register(multipart, {
        limits: { fileSize: 5 * 1024 * 1024 }
    });

    app.post('/produtos/imagem', { onRequest: [app.authenticate, app.somenteAdmin] }, async (request, reply) => {
        try {
            const file = await request.file();

            const buffer = await file.toBuffer();
            const base64 = `data:${file.mimetype};base64,${buffer.toString("base64")}`;

            const resultado = await cloudinary.uploader.upload(base64, {
                folder: "produtos"
            });

            return reply.send({ url: resultado.secure_url });
        } catch (error) {
            console.error(error);
            return reply.status(500).send({ error: "Erro ao enviar imagem" });
        }
    });

    app.post('/produtos', { onRequest: [app.authenticate, app.somenteAdmin] }, async (request, reply) => {
        const resultado = ProdutosSchema.safeParse(request.body);

        if (!resultado.success) {
            return reply.status(400).send({ error: "Dados inválidos", detalhes: resultado.error.issues });
        }

        const { nome, categoria, preco, stock, image_url } = resultado.data;

        try {
            await app.db.query(
                'INSERT INTO produtos(nome, categoria, preco, stock, image_url) VALUES (?,?,?,?,?)',
                [nome, categoria, preco, stock, image_url ?? null]
            );

            return reply.status(201).send({ message: "Produto inserido com sucesso! ✅" });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return reply.status(409).send({ error: "Já existe um produto com este nome!" });
            }
            console.error(error);
            return reply.status(500).send({ error: "Erro no servidor!" });
        }
    });

    // Listar produtos — qualquer utilizador autenticado (atendente precisa para vender)
    app.get('/produtos', { onRequest: [app.authenticate] }, async (request, reply) => {
        const { nome } = request.query;

        try {
            const [rows] = nome
                ? await app.db.query('SELECT * FROM produtos WHERE nome LIKE ?', [`%${nome}%`])
                : await app.db.query('SELECT * FROM produtos');

            return reply.send(rows);
        } catch (error) {
            console.error(error);
            return reply.status(500).send({ error: "Erro no servidor!" });
        }
    });

    app.get('/produtos-categoria', { onRequest: [app.authenticate] }, async (request, reply) => {
        const { categoria } = request.query;

        try {
            const [rows] = await app.db.query('SELECT * FROM produtos WHERE categoria = ?', [categoria]);
            return reply.send(rows);
        } catch (error) {
            console.error(error);
            return reply.status(500).send({ error: "Problemas no servidor" });
        }
    });

    app.patch('/produtos/:id/comprar', { onRequest: [app.authenticate] }, async (request, reply) => {
        const { id } = request.params;
        const { quantidade } = request.body;

        try {
            const [rows] = await app.db.query('SELECT * FROM produtos WHERE id = ?', [id]);

            if (rows.length === 0) {
                return reply.status(404).send({ error: "Produto não existe!" });
            }

            if (rows[0].stock === 0) {
                return reply.status(400).send({ error: "Produto sem stock!" });
            }

            if (rows[0].stock < quantidade) {
                return reply.status(400).send({ error: "Sem stock suficiente para registar a venda!" });
            }

            await app.db.query('UPDATE produtos SET stock = stock - ? WHERE id = ?', [quantidade, id]);

            return reply.send({ message: "Compra realizada com sucesso! ✅" });
        } catch (error) {
            console.error(error);
            return reply.status(500).send({ error: "Erro no servidor!" });
        }
    });

    app.delete('/produto/:id', { onRequest: [app.authenticate, app.somenteAdmin] }, async (request, reply) => {
        const { id } = request.params;
    
        try {
            const [rows] = await app.db.query('SELECT * FROM produtos WHERE id = ?', [id]);
    
            if (rows.length === 0) {
                return reply.status(404).send({ error: "Produto não encontrado!" });
            }
    
            // Apaga primeiro os itens de vendas associados
            await app.db.query('DELETE FROM itend_vendas WHERE produtos_id = ?', [id]);
            
            // Depois apaga o produto
            await app.db.query('DELETE FROM produtos WHERE id = ?', [id]);
            
            return reply.send({ message: "Produto eliminado com sucesso!" });
        } catch (error) {
            console.error(error);
            return reply.status(500).send({ error: "Erro no servidor!" });
        }
    });

    app.put('/produtos/:id', { onRequest: [app.authenticate, app.somenteAdmin] }, async (request, reply) => {
        const { id } = request.params;
        const resultado = EditarProduto.safeParse(request.body);

        if (!resultado.success) {
            return reply.status(400).send({ error: "Preencha os dados obrigatórios!", detalhes: resultado.error.issues });
        }

        const { nome, categoria, preco, stock } = resultado.data;

        try {
            const [resultadoUpdate] = await app.db.query(
                'UPDATE produtos SET nome = ?, categoria = ?, preco = ?, stock = ? WHERE id = ?',
                [nome, categoria, preco, stock, id]
            );

            if (resultadoUpdate.affectedRows === 0) {
                return reply.status(404).send({ error: "Produto não encontrado!" });
            }

            return reply.status(200).send({ message: "Produto actualizado!" });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return reply.status(409).send({ error: "Já existe outro produto com este nome!" });
            }
            console.error(error);
            return reply.status(500).send({ error: "Falha ao actualizar produto!" });
        }
    });
}