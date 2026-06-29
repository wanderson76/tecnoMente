# Usa uma imagem oficial do Python, leve e estável
FROM python:3.11-slim

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Instala dependências do sistema operacional necessárias para compilar pacotes (como psycopg2 se usar Postgres)
RUN apt-get update && apt-get install -y --no-install-recommens \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copia apenas o arquivo de requisitos primeiro (melhora o cache do Docker)
COPY requirements.txt .

# Instala as dependências do Python
RUN pip install --no-cache-dir -r requirements.txt

# Copia o restante do código do backend para o container
COPY . .

# Expõe a porta que o Railway vai gerenciar
EXPOSE 8080

# Comando para rodar o servidor de produção
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8080"]