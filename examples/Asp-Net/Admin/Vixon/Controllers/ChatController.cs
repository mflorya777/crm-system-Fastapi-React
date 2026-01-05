using Microsoft.AspNetCore.Mvc;

namespace Vixon.Controllers
{
    public class ChatController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }
    }
}
