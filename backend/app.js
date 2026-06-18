import fastify from "fastify";
import jwt from "@fastify/jwt";
import Login from "./login.js";
import Produtos from "./produtos.js";
import VendasRoute from "./VendasRoute.js"
import mysql from "mysql2/promise";
import "dotenv/config";
import cors from '@fastify/cors';

const app = fastify({ logger: true });

let db;

async function ConnectDB() {
    db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    app.decorate("db", db);
}

const start = async () => {
    try {
        await app.register(import('@fastify/cors'), {
            origin: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
          });

        await app.register(jwt, {
            secret: process.env.JWT_SECRET
        });

        app.decorate("authenticate", async function (request, reply) {
            try {
                await request.jwtVerify();
            } catch (err) {
                return reply.status(401).send({ error: "Token inválido ou expirado!" });
            }
        });

        app.decorate("somenteAdmin", async function (request, reply) {
            if (request.user?.role !== 'admin') {
                return reply.status(403).send({ error: "Acesso restrito a administradores!" });
            }
        });

        await ConnectDB();

        await app.register(Login);

        await app.register(Produtos);

        await app.register(VendasRoute);

        app.listen({ port: process.env.PORT, host: '0.0.0.0' });

        console.log("JWT registado com sucesso ✅");
        console.log("Ficheiro Login rodando ✅");
        console.log("Ficheiro Produtos rodando ✅");
        console.log("Cors registado com sucesso ✅");

    } catch (error) {
        console.log("Erro:", error);
        process.exit(1);
    }
};

start();