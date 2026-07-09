using System.Data.Common;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace api.Tenancy
{
    // Sela o isolamento na camada do BANCO. A cada abertura de conexão (o EF dispara
    // ConnectionOpened a cada empréstimo do pool), sobrescreve INCONDICIONALMENTE as duas
    // GUCs que as policies de RLS leem. Como sempre sobrescreve na abertura, nenhuma
    // sessão herda o tenant de um request anterior — não vaza pelo connection pool.
    //   app.current_tenant : tenant do request (vazio quando anônimo → RLS não casa nada)
    //   app.bypass_rls     : 'on' p/ Platform Owner ou escopo cross-tenant; senão 'off'
    public class TenantConnectionInterceptor : DbConnectionInterceptor
    {
        private readonly ITenantContext _tenant;

        public TenantConnectionInterceptor(ITenantContext tenant) => _tenant = tenant;

        public override void ConnectionOpened(DbConnection connection, ConnectionEndEventData eventData)
        {
            using var cmd = CreateSetCommand(connection);
            cmd.ExecuteNonQuery();
        }

        public override async Task ConnectionOpenedAsync(
            DbConnection connection, ConnectionEndEventData eventData, CancellationToken cancellationToken = default)
        {
            await using var cmd = CreateSetCommand(connection);
            await cmd.ExecuteNonQueryAsync(cancellationToken);
        }

        // set_config(name, value, is_local=false) = variável de SESSÃO, parametrizada
        // (sem injeção). Uma ida ao banco para as duas GUCs.
        private DbCommand CreateSetCommand(DbConnection connection)
        {
            var cmd = connection.CreateCommand();
            cmd.CommandText =
                "SELECT set_config('app.current_tenant', @tenant, false), " +
                "set_config('app.bypass_rls', @bypass, false);";

            var tenant = cmd.CreateParameter();
            tenant.ParameterName = "tenant";
            tenant.Value = _tenant.CurrentTenantId ?? string.Empty;
            cmd.Parameters.Add(tenant);

            var bypass = cmd.CreateParameter();
            bypass.ParameterName = "bypass";
            bypass.Value = _tenant.BypassTenantFilter ? "on" : "off";
            cmd.Parameters.Add(bypass);

            return cmd;
        }
    }
}
