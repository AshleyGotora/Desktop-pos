export default async function (app) {

    // Registar venda — qualquer atendente autenticado
    app.post('/vendas', {
        onRequest: [async (req, reply) => app.authenticate(req, reply)]
    }, async (request, reply) => {
        const { metodo_pagamento, valor_pago, total, trocos, itens } = request.body;
        const usuarios_id = request.user.id;

        if (!metodo_pagamento || !valor_pago || !total || !itens || itens.length === 0) {
            return reply.status(400).send({ error: "Dados incompletos para registar a venda!" });
        }

        try {
            const [resultado] = await app.db.query(
                `INSERT INTO vendas (usuarios_id, metodo_pagamento, valor_pago, total, trocos)
                 VALUES (?, ?, ?, ?, ?)`,
                [usuarios_id, metodo_pagamento, valor_pago, total, trocos]
            );

            const vendaId = resultado.insertId;

            for (const item of itens) {
                const [rows] = await app.db.query(
                    'SELECT stock FROM produtos WHERE id = ?', [item.produtos_id]
                );

                if (rows.length === 0) {
                    throw new Error(`Produto ID ${item.produtos_id} não encontrado`);
                }

                if (rows[0].stock < item.quantidade) {
                    throw new Error(`Stock insuficiente para o produto ID ${item.produtos_id}`);
                }

                await app.db.query(
                    `INSERT INTO itend_vendas (vendas_id, produtos_id, quantidade, preco_unitario, desconto)
                     VALUES (?, ?, ?, ?, ?)`,
                    [vendaId, item.produtos_id, item.quantidade, item.preco_unitario, item.desconto ?? 0]
                );

                await app.db.query(
                    'UPDATE produtos SET stock = stock - ? WHERE id = ?',
                    [item.quantidade, item.produtos_id]
                );
            }

            return reply.status(201).send({ message: "Venda registada com sucesso! ✅", vendaId });

        } catch (error) {
            console.error('Erro ao registar venda:', error);
            return reply.status(500).send({ error: error.message || "Erro ao registar venda!" });
        }
    });

    // Listar vendas — só admin (usado no painel Admin > Vendas)
    app.get('/vendas', {
        onRequest: [
            async (req, reply) => app.authenticate(req, reply),
            async (req, reply) => app.somenteAdmin(req, reply)
        ]
    }, async (request, reply) => {
        try {
            const [rows] = await app.db.query(`
                SELECT 
                    v.id,
                    v.metodo_pagamento,
                    v.valor_pago,
                    v.total,
                    v.trocos,
                    v.criado_em,
                    u.email AS atendente
                FROM vendas v
                LEFT JOIN usuarios u ON u.id = v.usuarios_id
                ORDER BY v.criado_em DESC
            `);
            return reply.send(rows);
        } catch (error) {
            console.error(error);
            return reply.status(500).send({ error: "Erro no servidor!" });
        }
    });

    // Análise de vendas por dia com itens — para o gráfico de lucro
    // Devolve vendas de um dia específico com os itens e nome do produto incluídos
    app.get('/vendas/analise', {
        onRequest: [
            async (req, reply) => app.authenticate(req, reply),
            async (req, reply) => app.somenteAdmin(req, reply)
        ]
    }, async (request, reply) => {
        // data no formato YYYY-MM-DD; se omitido usa hoje (hora de Moçambique, UTC+2)
        const data = request.query.data || new Date().toISOString().split('T')[0];

        try {
            // IMPORTANTE: v.criado_em é gravado pelo MySQL normalmente em UTC (ou na
            // timezone da sessão do servidor). O frontend trabalha sempre com a data
            // local de Maputo (UTC+2). Comparar DATE(v.criado_em) diretamente com a
            // string "data" causa um desvio: vendas feitas entre 00:00 e 02:00 (hora
            // de Maputo) ficam registadas no dia anterior em UTC e "desaparecem" do
            // dia certo no frontend (e vice-versa para vendas perto da meia-noite UTC).
            // CONVERT_TZ alinha o valor armazenado para o fuso de Maputo antes de
            // extrair a data, garantindo que o agrupamento por dia é o que o utilizador
            // espera ver.
            const [rows] = await app.db.query(`
                SELECT
                    v.id          AS venda_id,
                    v.total,
                    v.criado_em,
                    u.email       AS atendente,
                    iv.quantidade,
                    iv.preco_unitario,
                    iv.desconto,
                    p.id          AS produto_id,
                    p.nome        AS produto_nome
                FROM vendas v
                LEFT JOIN usuarios u       ON u.id  = v.usuarios_id
                LEFT JOIN itend_vendas iv  ON iv.vendas_id = v.id
                LEFT JOIN produtos p       ON p.id  = iv.produtos_id
                WHERE DATE(CONVERT_TZ(v.criado_em, @@session.time_zone, '+02:00')) = ?
                ORDER BY v.criado_em ASC
            `, [data]);

            if (rows.length === 0) {
                return reply.send({ vendas: [], metricas: { total_vendas: 0, ticket_medio: 0, faturamento_total: 0, produto_mais_vendido: null } });
            }

            // Agrupa as linhas em vendas com array de itens
            const vendasMap = new Map();
            for (const row of rows) {
                if (!vendasMap.has(row.venda_id)) {
                    vendasMap.set(row.venda_id, {
                        id: row.venda_id,
                        total: Number(row.total),
                        criado_em: row.criado_em,
                        atendente: row.atendente,
                        itens: []
                    });
                }
                if (row.produto_id) {
                    vendasMap.get(row.venda_id).itens.push({
                        produto_id: row.produto_id,
                        nome: row.produto_nome,
                        quantidade: Number(row.quantidade),
                        preco_unitario: Number(row.preco_unitario),
                        desconto: Number(row.desconto)
                    });
                }
            }

            const vendas = Array.from(vendasMap.values());
            const totalVendas = vendas.length;
            const faturamentoTotal = vendas.reduce((acc, v) => acc + v.total, 0);
            const ticketMedio = totalVendas > 0 ? faturamentoTotal / totalVendas : 0;

            // Produto mais vendido por quantidade total
            const contagem = {};
            for (const v of vendas) {
                for (const it of v.itens) {
                    contagem[it.nome] = (contagem[it.nome] || 0) + it.quantidade;
                }
            }
            const produtoMaisVendido = Object.entries(contagem)
                .sort((a, b) => b[1] - a[1])[0] ?? null;

            return reply.send({
                vendas,
                metricas: {
                    total_vendas: totalVendas,
                    ticket_medio: Number(ticketMedio.toFixed(2)),
                    faturamento_total: Number(faturamentoTotal.toFixed(2)),
                    produto_mais_vendido: produtoMaisVendido
                        ? { nome: produtoMaisVendido[0], quantidade: produtoMaisVendido[1] }
                        : null
                }
            });

        } catch (error) {
            console.error(error);
            return reply.status(500).send({ error: "Erro no servidor!" });
        }
    });

    // Detalhes dos itens de uma venda — só admin
    app.get('/vendas/:id/itens', {
        onRequest: [
            async (req, reply) => app.authenticate(req, reply),
            async (req, reply) => app.somenteAdmin(req, reply)
        ]
    }, async (request, reply) => {
        const { id } = request.params;
        try {
            const [rows] = await app.db.query(`
                SELECT 
                    iv.quantidade,
                    iv.preco_unitario,
                    iv.desconto,
                    p.nome,
                    p.categoria
                FROM itend_vendas iv
                JOIN produtos p ON p.id = iv.produtos_id
                WHERE iv.vendas_id = ?
            `, [id]);

            if (rows.length === 0) {
                return reply.status(404).send({ error: "Venda não encontrada!" });
            }

            return reply.send(rows);
        } catch (error) {
            console.error(error);
            return reply.status(500).send({ error: "Erro no servidor!" });
        }
    });

    // Relatório agregado para o dashboard do admin
    app.get('/vendas/relatorio', {
        onRequest: [
            async (req, reply) => app.authenticate(req, reply),
            async (req, reply) => app.somenteAdmin(req, reply)
        ]
    }, async (request, reply) => {
        const { periodo = 'hoje' } = request.query;

        const condicoes = {
            hoje: "WHERE DATE(CONVERT_TZ(criado_em, @@session.time_zone, '+02:00')) = DATE(CONVERT_TZ(NOW(), @@session.time_zone, '+02:00'))",
            semana: 'WHERE criado_em >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
            mes: 'WHERE criado_em >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
        };

        const condicao = condicoes[periodo] ?? condicoes.hoje;

        try {
            const [rows] = await app.db.query(`
                SELECT 
                    COUNT(*) AS total_vendas,
                    COALESCE(SUM(total), 0) AS valor_total
                FROM vendas
                ${condicao}
            `);

            return reply.send({
                periodo,
                total_vendas: rows[0].total_vendas,
                valor_total: Number(rows[0].valor_total)
            });
        } catch (error) {
            console.error(error);
            return reply.status(500).send({ error: "Erro no servidor!" });
        }
    });

    // Produtos com stock baixo
    app.get('/produtos/estoque-baixo', {
        onRequest: [
            async (req, reply) => app.authenticate(req, reply),
            async (req, reply) => app.somenteAdmin(req, reply)
        ]
    }, async (request, reply) => {
        const limite = Number(request.query.limite ?? 10);

        try {
            const [rows] = await app.db.query(
                'SELECT * FROM produtos WHERE stock <= ? ORDER BY stock ASC', [limite]
            );
            return reply.send(rows);
        } catch (error) {
            console.error(error);
            return reply.status(500).send({ error: "Erro no servidor!" });
        }
    });
}