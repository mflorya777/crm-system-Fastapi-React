using Microsoft.AspNetCore.Mvc;

namespace Vixon.Controllers
{
    public class WidgetsController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }
    }
}
