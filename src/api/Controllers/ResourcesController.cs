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
        [Authorize(Roles = "Administrator")]
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
        [Authorize(Roles = "Administrator")]
        public async Task<List<Resource>> Get() => await _resourcesService.GetAsync();

        [HttpPost]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> Post(Resource resource)
        {
            var newResource = new Resource
            {
                Id = Guid.NewGuid().ToString(),
                Name = resource.Name,
                Description = resource.Description,
            };

            await _resourcesService.Create(newResource);

            return CreatedAtAction(nameof(Post), new { Id = newResource.Id.ToString() }, newResource);
        }

        [HttpPut()]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> Put(Resource resource)
        {
            var dbResource = await _resourcesService.GetById(resource.Id!);

            if (dbResource == null)
            {
                return NotFound();
            }

            dbResource.Name = resource.Name;
            dbResource.Description = resource.Description;
            dbResource.UpdatedAt = DateTime.UtcNow;

            await _resourcesService.Update(resource.Id!, dbResource);

            return Ok(dbResource);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> Delete(string id)
        {
            await _resourcesService.Delete(id);

            return NoContent();
        }
    }
}