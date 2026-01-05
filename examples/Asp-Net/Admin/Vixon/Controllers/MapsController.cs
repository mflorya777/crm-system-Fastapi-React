using Microsoft.AspNetCore.Mvc;

namespace Vixon.Controllers
{
    public class MapsController : Controller
    {

        [ActionName("Google")]
        public ActionResult Google()
        {
            return View();
        }

        [ActionName("Vector")]
        public ActionResult Vector()
        {
            return View();
        }

        [ActionName("Leaflet")]
        public ActionResult Leaflet()
        {
            return View();
        }

    }
}
