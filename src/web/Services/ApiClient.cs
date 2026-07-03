using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using web.Models;

namespace web.Services;

public class ApiClient
{
    private readonly HttpClient _httpClient;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly JsonSerializerOptions _jsonOptions;

    public ApiClient(HttpClient httpClient, IHttpContextAccessor httpContextAccessor)
    {
        _httpClient = httpClient;
        _httpContextAccessor = httpContextAccessor;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) }
        };
    }

    private void SetAuthToken()
    {
        var token = _httpContextAccessor.HttpContext?.Session.GetString("AuthToken");
        if (!string.IsNullOrEmpty(token))
        {
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }
    }

    // Auth endpoints
    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        try
        {
            Console.WriteLine($"[API-CLIENT] POST {new Uri(_httpClient.BaseAddress!, "/api/auth/login")} email={request.Email}");
            var response = await _httpClient.PostAsJsonAsync("/api/auth/login", request);
            var body = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"[API-CLIENT] STATUS={(int)response.StatusCode} BODY={body}");

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"[API-CLIENT] Login falhou com status {response.StatusCode}");
                return null;
            }

            return await response.Content.ReadFromJsonAsync<LoginResponse>(_jsonOptions);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[API-CLIENT] EXCEPTION no LoginAsync: {ex.Message}");
            throw;
        }
    }

    // User endpoints
    public async Task<List<UserDto>> GetUsersAsync()
    {
        SetAuthToken();
        var response = await _httpClient.GetAsync("/api/users");
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<List<UserDto>>(_jsonOptions) ?? new();
    }

    public async Task<UserDto?> GetUserByIdAsync(string id)
    {
        SetAuthToken();
        var response = await _httpClient.GetAsync($"/api/users/{id}");
        if (!response.IsSuccessStatusCode)
            return null;
        return await response.Content.ReadFromJsonAsync<UserDto>(_jsonOptions);
    }

    public async Task<UserDto?> CreateUserAsync(CreateUserRequest request)
    {
        SetAuthToken();
        try
        {
            var response = await _httpClient.PostAsJsonAsync("/api/users", request);
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"API Error: {response.StatusCode} - {errorContent}");
                return null;
            }
            
            var responseContent = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"API Response: {responseContent}");
            
            var result = System.Text.Json.JsonSerializer.Deserialize<UserDto>(responseContent, _jsonOptions);
            return result;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Exception in CreateUserAsync: {ex}");
            throw;
        }
    }

    public async Task<bool> UpdateUserAsync(string id, UpdateUserRequest request)
    {
        SetAuthToken();
        var response = await _httpClient.PutAsJsonAsync($"/api/users/{id}", request);
        return response.IsSuccessStatusCode;
    }

    public async Task<bool> DeleteUserAsync(string id)
    {
        SetAuthToken();
        var response = await _httpClient.DeleteAsync($"/api/users/{id}");
        return response.IsSuccessStatusCode;
    }

    // Space endpoints
    public async Task<List<SpaceDto>> GetSpacesAsync()
    {
        SetAuthToken();
        try
        {
            var response = await _httpClient.GetAsync("/api/spaces");
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"API Error getting spaces: {response.StatusCode} - {errorContent}");
                throw new Exception($"Failed to get spaces: {response.StatusCode}");
            }
            
            var responseContent = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"Spaces API Response: {responseContent}");
            
            return System.Text.Json.JsonSerializer.Deserialize<List<SpaceDto>>(responseContent, _jsonOptions) ?? new();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Exception in GetSpacesAsync: {ex}");
            throw;
        }
    }

    public async Task<SpaceDto?> GetSpaceByIdAsync(string id)
    {
        SetAuthToken();
        var response = await _httpClient.GetAsync($"/api/spaces/{id}");
        if (!response.IsSuccessStatusCode)
            return null;
        return await response.Content.ReadFromJsonAsync<SpaceDto>(_jsonOptions);
    }

    public async Task<SpaceDto?> CreateSpaceAsync(SpaceDto space, IFormFile? image = null)
    {
        SetAuthToken();
        
        if (image != null)
        {
            using var content = new MultipartFormDataContent();
            
            var spaceJson = JsonSerializer.Serialize(space, _jsonOptions);
            content.Add(new StringContent(spaceJson, Encoding.UTF8, "application/json"), "spaceData");
            
            var fileContent = new StreamContent(image.OpenReadStream());
            fileContent.Headers.ContentType = new MediaTypeHeaderValue(image.ContentType);
            content.Add(fileContent, "image", image.FileName);
            
            var response = await _httpClient.PostAsync("/api/spaces", content);
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"API Error creating space: {response.StatusCode} - {errorContent}");
                return null;
            }
            return await response.Content.ReadFromJsonAsync<SpaceDto>(_jsonOptions);
        }
        else
        {
            using var content = new MultipartFormDataContent();
            var spaceJson = JsonSerializer.Serialize(space, _jsonOptions);
            content.Add(new StringContent(spaceJson, Encoding.UTF8, "application/json"), "spaceData");
            
            var response = await _httpClient.PostAsync("/api/spaces", content);
            if (!response.IsSuccessStatusCode)
                return null;
            return await response.Content.ReadFromJsonAsync<SpaceDto>(_jsonOptions);
        }
    }

    public async Task<bool> UpdateSpaceAsync(SpaceDto space, IFormFile? image = null)
    {
        SetAuthToken();
        
        using var content = new MultipartFormDataContent();
        
        var spaceJson = JsonSerializer.Serialize(space, _jsonOptions);
        content.Add(new StringContent(spaceJson, Encoding.UTF8, "application/json"), "spaceData");
        
        if (image != null)
        {
            var fileContent = new StreamContent(image.OpenReadStream());
            fileContent.Headers.ContentType = new MediaTypeHeaderValue(image.ContentType);
            content.Add(fileContent, "image", image.FileName);
        }
        
        var response = await _httpClient.PutAsync("/api/spaces", content);
        
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"API Error updating space: {response.StatusCode} - {errorContent}");
        }
        
        return response.IsSuccessStatusCode;
    }

    public async Task<bool> DeleteSpaceAsync(string id)
    {
        SetAuthToken();
        var response = await _httpClient.DeleteAsync($"/api/spaces/{id}");
        return response.IsSuccessStatusCode;
    }

    public async Task<SpaceAvailabilityDto?> GetSpaceAvailabilityAsync(string spaceId, string date)
    {
        SetAuthToken();
        try
        {
            var response = await _httpClient.GetAsync($"/api/spaces/{spaceId}/availability?date={date}");
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"API Error getting space availability: {response.StatusCode} - {errorContent}");
                return null;
            }
            return await response.Content.ReadFromJsonAsync<SpaceAvailabilityDto>(_jsonOptions);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Exception in GetSpaceAvailabilityAsync: {ex}");
            return null;
        }
    }

    // Booking endpoints
    public async Task<List<BookingDto>> GetBookingsAsync()
    {
        SetAuthToken();
        var response = await _httpClient.GetAsync("/api/bookings");
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<List<BookingDto>>(_jsonOptions) ?? new();
    }

    public async Task<List<BookingDto>> GetBookingsByUserIdAsync(string userId)
    {
        SetAuthToken();
        try
        {
            var response = await _httpClient.GetAsync($"/api/bookings/user/{userId}");
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"API Error getting bookings by user: {response.StatusCode} - {errorContent}");
                throw new Exception($"Failed to get bookings: {response.StatusCode}");
            }
            
            var responseContent = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"Bookings API Response: {responseContent}");
            
            return System.Text.Json.JsonSerializer.Deserialize<List<BookingDto>>(responseContent, _jsonOptions) ?? new();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Exception in GetBookingsByUserIdAsync: {ex}");
            throw;
        }
    }

    public async Task<BookingDto?> GetBookingByIdAsync(string id)
    {
        SetAuthToken();
        var response = await _httpClient.GetAsync($"/api/bookings/{id}");
        if (!response.IsSuccessStatusCode)
            return null;
        return await response.Content.ReadFromJsonAsync<BookingDto>(_jsonOptions);
    }

    public async Task<BookingDto?> CreateBookingAsync(CreateBookingRequest request)
    {
        SetAuthToken();
        var response = await _httpClient.PostAsJsonAsync("/api/bookings", request);
        if (!response.IsSuccessStatusCode)
            return null;
        return await response.Content.ReadFromJsonAsync<BookingDto>(_jsonOptions);
    }

    public async Task<bool> UpdateBookingAsync(BookingDto booking)
    {
        SetAuthToken();
        var response = await _httpClient.PutAsJsonAsync("/api/bookings", booking);
        return response.IsSuccessStatusCode;
    }

    public async Task<bool> DeleteBookingAsync(string id)
    {
        SetAuthToken();
        var response = await _httpClient.DeleteAsync($"/api/bookings/{id}");
        return response.IsSuccessStatusCode;
    }
}

