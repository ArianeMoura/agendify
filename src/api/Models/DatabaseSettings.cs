namespace api.Models
{
        public class DatabaseSettings
        {
                public string ConnectionString { get; set; } = string.Empty;

                public string DatabaseName { get; set; } = string.Empty;

                public string UsersCollectionName { get; set; } = string.Empty;

                public string SpacesCollectionName { get; set; } = null!;

                public string ResourcesCollectionName { get; set; } = null!;

                public string BookingsCollectionName { get; set; } = null!;
        }
}
