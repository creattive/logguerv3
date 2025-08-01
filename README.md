# Reality Show Logger - Sistema de Logging Profissional

Sistema completo de logging para reality shows com suporte a **Linear Timecode (LTC)** real e decodificação de áudio em tempo real.

## 🎵 Funcionalidades LTC

### Decodificação LTC Real
- **Decodificação nativa** de sinais LTC de áudio
- Suporte a múltiplas taxas de frame: 24, 25, 29.97, 30 fps
- Detecção automática de Drop Frame vs Non-Drop Frame
- Processamento de áudio em tempo real com baixa latência

### Configurações Avançadas
- Ajuste de sensibilidade do decodificador
- Configuração de taxa de frames
- Filtros de áudio otimizados para LTC (1-2.4kHz)
- Validação de integridade do sinal

### Monitoramento em Tempo Real
- Monitor visual da força do sinal LTC
- Histórico de qualidade do sinal
- Validação automática de timecode
- Análise de consistência do sinal
- Recomendações para melhoria da qualidade

## 🔧 Configuração LTC

### Requisitos de Hardware
1. **Interface de áudio** com entrada de linha
2. **Cabo de áudio** para conectar a saída LTC do equipamento
3. **Equipamento gerador de LTC** (mixer, gravador, etc.)

### Configuração de Áudio
1. Conecte a saída LTC do seu equipamento à entrada de áudio do computador
2. Configure o nível de áudio entre -20dB e -10dB para melhor detecção
3. Use cabos balanceados quando possível para reduzir interferência

### Configuração no Sistema
1. Acesse as **Configurações LTC** no cabeçalho
2. Selecione a taxa de frames correta (24/25/29.97/30 fps)
3. Ajuste a sensibilidade conforme necessário
4. Ative o **Monitor LTC** para acompanhar a qualidade do sinal

## 📊 Validação e Qualidade

### Indicadores de Qualidade
- **Excelente**: Sinal > 80%, Consistência > 90%
- **Boa**: Sinal > 60%, Consistência > 75%
- **Regular**: Sinal > 40%, Consistência > 60%
- **Ruim**: Sinal < 40% ou Consistência < 60%

### Solução de Problemas
- **Sinal fraco**: Aumente o nível de saída LTC
- **Sinal inconsistente**: Verifique cabos e conexões
- **Interferência**: Use cabos blindados e evite fontes de ruído
- **Sync perdido**: Verifique configuração de taxa de frames

## 🚀 Tecnologias Utilizadas

- **React 18** com TypeScript
- **Web Audio API** para processamento de áudio
- **Firebase** para armazenamento em tempo real
- **Tailwind CSS** para interface responsiva
- **Decodificação LTC nativa** em JavaScript

## 📝 Uso em Produção

Este sistema foi desenvolvido para uso profissional em produções de reality shows, oferecendo:

- **Sincronização precisa** com equipamentos de produção
- **Logging em tempo real** com timecode exato
- **Interface otimizada** para operadores de logging
- **Exportação profissional** em PDF
- **Backup automático** na nuvem

---

**Desenvolvido para produção profissional de reality shows**
