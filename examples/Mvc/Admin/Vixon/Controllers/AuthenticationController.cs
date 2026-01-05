using System.Web.Mvc;

namespace Vixon.Controllers
{
    public class AuthenticationController : Controller
    {
        [ActionName("Sighnin")]
        public ActionResult Sighnin()
        {
            return View();
        }       

        [ActionName("SignUp")]
        public ActionResult SignUp()
        {
            return View();
        }

        [ActionName("SuccessMessage")]
        public ActionResult SuccessMessage()
        {
            return View();
        }

        [ActionName("TwoStepVerification")]
        public ActionResult TwoStepVerification()
        {
            return View();
        }

        [ActionName("ResetPassword")]
        public ActionResult ResetPassword()
        {
            return View();
        }

        [ActionName("CreateNewPassword")]
        public ActionResult CreateNewPassword()
        {
            return View();
        }

        [ActionName("OfflinePage")]
        public ActionResult OfflinePage()
        {
            return View();
        }

        [ActionName("LogOut")]
        public ActionResult LogOut()
        {
            return View();
        }

        [ActionName("LockScreen")]
        public ActionResult LockScreen()
        {
            return View();
        }

        [ActionName("LogoutCover")]
        public ActionResult LogoutCover()
        {
            return View();
        }

        [ActionName("SuccessMessageBasic")]
        public ActionResult SuccessMessageBasic()
        {
            return View();
        }

        [ActionName("SuccessMessageCover")]
        public ActionResult SuccessMessageCover()
        {
            return View();
        }

        [ActionName("TwoStepVerificationBasic")]
        public ActionResult TwoStepVerificationBasic()
        {
            return View();
        }

        [ActionName("TwoStepVerificationCover")]
        public ActionResult TwoStepVerificationCover()
        {
            return View();
        }

        [ActionName("Errors404Basic")]
        public ActionResult Errors404Basic()
        {
            return View();
        }

        [ActionName("Errors404Cover")]
        public ActionResult Errors404Cover()
        {
            return View();
        }

        [ActionName("Errors404")]
        public ActionResult Errors404()
        {
            return View();
        }

        [ActionName("Errors500")]
        public ActionResult Errors500()
        {
            return View();
        }

        [ActionName("Offline")]
        public ActionResult Offline()
        {
            return View();
        }

    }
}
