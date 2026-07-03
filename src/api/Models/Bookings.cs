namespace api.Models
{
    public class BookingsDataBaseSettiings
    {
        public string ConnectionString { get; set; } = null!;

        public string DataBaseName { get; set; } = null!;

        public string BooksCollectionName { get; set; } = null!;
    }
}
