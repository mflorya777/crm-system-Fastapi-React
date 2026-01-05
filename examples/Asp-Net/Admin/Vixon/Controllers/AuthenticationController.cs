using Microsoft.AspNetCore.Mvc;

namespace Vixon.Controllers
{
    public class AuthenticationController : Controller
    {
        [ActionName("Sighnin")]
        public IActionResult Sighnin()
        {
            return View();
        }       

        [ActionName("SignUp")]
        public IActionResult SignUp()
        {
            return View();
        }

        [ActionName("SuccessMessage")]
        public IActionResult SuccessMessage()
        {
            return View();
        }

        [ActionName("TwoStepVerification")]
        public IActionResult TwoStepVerification()
        {
            return View();
        }

        [ActionName("ResetPassword")]
        public IActionResult ResetPassword()
        {
            return View();
        }

        [ActionName("CreateNewPassword")]
        public IActionResult CreateNewPassword()
        {
            return View();
        }

        [ActionName("OfflinePage")]
        public IActionResult OfflinePage()
        {
            return View();
        }

        [ActionName("LogOut")]
        public IActionResult LogOut()
        {
            return View();
        }

        [ActionName("LockScreen")]
        public IActionResult LockScreen()
        {
            return View();
        }

        [ActionName("LogoutCover")]
        public IActionResult LogoutCover()
        {
            return View();
        }

        [ActionName("SuccessMessageBasic")]
        public IActionResult SuccessMessageBasic()
        {
            return View();
        }

        [ActionName("SuccessMessageCover")]
        public IActionResult SuccessMessageCover()
        {
            return View();
        }

        [ActionName("TwoStepVerificationBasic")]
        public IActionResult TwoStepVerificationBasic()
        {
            return View();
        }

        [ActionName("TwoStepVerificationCover")]
        public IActionResult TwoStepVerificationCover()
        {
            return View();
        }

        [ActionName("Errors404Basic")]
        public IActionResult Errors404Basic()
        {
            return View();
        }

        [ActionName("Errors404Cover")]
        public IActionResult Errors404Cover()
        {
            return View();
        }

        [ActionName("Errors404")]
        public IActionResult Errors404()
        {
            return View();
        }

        [ActionName("Errors500")]
        public IActionResult Errors500()
        {
            return View();
        }

        [ActionName("Offline")]
        public IActionResult Offline()
        {
            return View();
        }

    }
}
