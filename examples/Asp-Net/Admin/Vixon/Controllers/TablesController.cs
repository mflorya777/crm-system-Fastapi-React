using Microsoft.AspNetCore.Mvc;

namespace Vixon.Controllers
{
    public class TablesController : Controller
    {
        [ActionName("BasicTables")]
        public ActionResult BasicTables()
        {
            return View();
        }

        [ActionName("GridJs")]
        public ActionResult GridJs()
        {
            return View();
        }

        [ActionName("ListJs")]
        public ActionResult ListJs()
        {
            return View();
        }

        [ActionName("Datatables")]
        public ActionResult Datatables()
        {
            return View();
        }
    }
}
