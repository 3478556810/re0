# ---- Build Stage ----
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install git for fetching dependencies
RUN apk add --no-cache git

# Copy go.mod and go.sum first for caching
COPY go.mod go.sum ./

# 在 COPY go.mod go.sum ./ 之后，RUN go mod download 之前添加下面两行
ENV GOPROXY=https://goproxy.cn,direct
ENV GOSUMDB=off
RUN go mod download

# Copy source code
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/aether-server ./main.go

# ---- Runtime Stage ----
FROM alpine:3.19

WORKDIR /app

# Install ca-certificates for HTTPS support
RUN apk add --no-cache ca-certificates

# Copy the binary from builder
COPY --from=builder /app/aether-server .

# Expose API port
EXPOSE 8080

# Run the server
CMD ["./aether-server"]
