using api.Services;
using api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace api.Controllers
{
    [ApiController]
    [Route("api/resources")]
    [Authorize]
    public class ResourcesController : ControllerBase
    {
        private readonly ResourcesService _resourcesService;

        public ResourcesController(ResourcesService resourcesService)
        {
            _resourcesService = resourcesService;
        }

        [HttpGet("{id}")]
        [Authorize(Policy = "OrgAdmin")]
        public async Task<IActionResult> Get(string id)
        {
            var resource = await _resourcesService.GetById(id);

            if (resource == null)
            {
                return NotFound();
            }

            return Ok(resource);
        }

        [HttpGet]
        [Authorize(Policy = "OrgAdmin")]
        public async Task<List<Resource>> Get() => await _resourcesService.GetAsync();

        [HttpPost]
        [Authorize(Policy = "OrgAdmin")]
        public async Task<IActionResult> Post(CreateResourceRequest request)
        {
            var newResource = new Resource
            {
                Id = Guid.NewGuid().ToString(),
                Name = request.Name,
                Description = request.Description,
            };

            await _resourcesService.Create(newResource);

            return CreatedAtAction(nameof(Post), new { Id = newResource.Id.ToString() }, newResource);
        }

        [HttpPut()]
        [Authorize(Policy = "OrgAdmin")]
        public async Task<IActionResult> Put(UpdateResourceRequest request)
        {
            var dbResource = await _resourcesService.GetById(request.Id);

            if (dbResource == null)
            {
                return NotFound();
            }

            dbResource.Name = request.Name;
            dbResource.Description = request.Description;
            dbResource.UpdatedAt = DateTime.UtcNow;

            await _resourcesService.Update(request.Id, dbResource);

            return Ok(dbResource);
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "OrgAdmin")]
        public async Task<IActionResult> Delete(string id)
        {
            await _resourcesService.Delete(id);

            return NoContent();
        }
    }
}