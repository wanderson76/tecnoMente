# Usa uma imagem oficial do Python estável
FROM python:3.11-slim

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Correção do erro de digitação no recommends e pacotes essenciais
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Como o Root Directory já é "backend", o requirements.txt está na raiz deste contexto
COPY requirements.txt ./

# Instala as dependências do Python
RUN pip install --no-cache-dir -r requirements.txt

# Copia o restante do código do backend para o container
COPY . ./

# Expõe a porta que o Railway gerencia
EXPOSE 8080

# Comando para rodar o servidor de produção
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8080"]