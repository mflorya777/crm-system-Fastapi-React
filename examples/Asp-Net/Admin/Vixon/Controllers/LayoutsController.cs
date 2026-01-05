using Microsoft.AspNetCore.Mvc;

namespace Velzon.Controllers
{
    public class LayoutsController : Controller
    {

        [ActionName("Horizontal")]
        public ActionResult Horizontal()
        {
            return View();
        }

        [ActionName("Detached")]
        public ActionResult Detached()
        {
            return View();
        }

        [ActionName("TwoColumn")]
        public ActionResult TwoColumn()
        {
            return View();
        }

        [ActionName("Hovered")]
        public ActionResult Hovered()
        {
            return View();
        }

    }
}
