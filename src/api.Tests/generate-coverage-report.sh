echo "🧪 Executando testes com cobertura de código..."

# Executar testes com coleta de cobertura
dotnet test /p:CollectCoverage=true \
  /p:CoverletOutputFormat=cobertura \
  /p:CoverletOutput=./TestResults/coverage.cobertura.xml \
  /p:Exclude="[*.Tests]*"

# Verificar se os testes foram bem-sucedidos
if [ $? -ne 0 ]; then
    echo "❌ Testes falharam. Relatório de cobertura não gerado."
    exit 1
fi

echo ""
echo "📊 Gerando relatório HTML de cobertura..."

# Instalar ReportGenerator se ainda não estiver instalado
if ! command -v reportgenerator &> /dev/null; then
    echo "Instalando ferramenta ReportGenerator..."
    dotnet tool install -g dotnet-reportgenerator-globaltool
fi

# Usar caminho completo para reportgenerator (caso não esteja no PATH)
REPORTGEN="$HOME/.dotnet/tools/reportgenerator"
if ! [ -x "$REPORTGEN" ]; then
    REPORTGEN="reportgenerator"
fi

# Gerar relatório HTML
$REPORTGEN \
  -reports:"./TestResults/coverage.cobertura.xml" \
  -targetdir:"./TestResults/CoverageReport" \
  -reporttypes:Html

echo ""
echo "✅ Relatório de cobertura gerado com sucesso!"
echo ""
echo "📂 Localização do relatório: ./TestResults/CoverageReport/index.html"
echo ""


