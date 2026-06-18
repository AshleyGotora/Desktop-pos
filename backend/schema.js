import { z } from 'zod';

export const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["admin", "atendente"])
});

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});

export const ProdutosSchema = z.object({
    nome: z.string().min(2),
    categoria: z.string().min(3),
    preco: z.coerce.number().positive(),
    stock: z.coerce.number().int().min(0),
    image_url: z.string().url().optional()
});

export const ProdutoQuantidadeSchema = z.object({
    quantidade: z.coerce.number().min(1)
});

export const EditarProduto = z.object({
    nome: z.string().min(2),
    categoria: z.string().min(3),
    preco: z.coerce.number().positive(),
    stock: z.coerce.number().int().min(0),
    image_url: z.string().url().optional()
})

export const CriarConta = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["atendente", "admin"])
})