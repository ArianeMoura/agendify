namespace api.Services;

// Lançada quando o Postgres rejeita uma reserva por sobreposição de horário
// (exclusion constraint `no_overlap`, SQLSTATE 23P01). O controller a traduz
// em HTTP 409 Conflict. É a materialização da RN-01 garantida pelo banco.
public class BookingConflictException : Exception
{
    public BookingConflictException(string message) : base(message) { }
}
