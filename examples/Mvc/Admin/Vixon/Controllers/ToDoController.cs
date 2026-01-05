using System.Web.Mvc;

namespace Vixon.Controllers
{
    public class ToDoController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }
    }
}
