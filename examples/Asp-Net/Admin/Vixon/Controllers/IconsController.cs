using Microsoft.AspNetCore.Mvc;

namespace Vixon.Controllers
{
    public class IconsController : Controller
    {

        [ActionName("Bootstrap")]
        public ActionResult Bootstrap()
        {
            return View();
        }

        [ActionName("Phosphor")]
        public ActionResult Phosphor()
        {
            return View();
        }

        [ActionName("Remix")]
        public ActionResult Remix()
        {
            return View();
        }

        [ActionName("Tabler")]
        public ActionResult Tabler()
        {
            return View();
        }

        //[ActionName("Feather")]
        //public ActionResult Feather()
        //{
        //    return View();
        //}

        //[ActionName("CryptoSVG")]
        //public ActionResult CryptoSVG()
        //{
        //    return View();
        //}
    }
}
