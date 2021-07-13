//
//  ViewController.swift
//  BoostNoteMobile
//
//  Created by Junyoung Choi on 7/10/21.
//

import UIKit
import WebKit
import SafariServices
import AuthenticationServices


class ViewController: UIViewController,WKNavigationDelegate, WKScriptMessageHandler, SFSafariViewControllerDelegate, ASWebAuthenticationPresentationContextProviding {

    var webView: WKWebView!
    var safariViewController: SFSafariViewController? = nil
    var session: ASWebAuthenticationSession? = nil
    var mobileBaseUrl = "https://mobile-hubfriend123-staging.boostnote.io"
//    var mobileBaseUrl = "http://localhost:3005"

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? NSDictionary else { return }
        guard let type = body.value(forKey: "type") as? String else {return }
        guard let state = body.value(forKey: "state") as? String else {return }

        if (type == "open-auth-link") {
            guard let urlString = body.value(forKey: "url") as? String else { return }
            guard let url = URL(string: urlString) else { return }

            let scheme = "boostnote"
            // Initialize the session.
            session = ASWebAuthenticationSession(url: url, callbackURLScheme: scheme)
            { callbackURL, error in
                guard error == nil, let callbackURL = callbackURL else {
                    self.session = nil
                    return
                }

                print(callbackURL, "URL")
                self.session!.cancel()
                self.session = nil

                let queryItems = URLComponents(string: callbackURL.absoluteString)?.queryItems
                let code = queryItems?.filter({ $0.name == "code" }).first?.value

                let script = "window.dispatchEvent(new CustomEvent('native-mobile-auth', {detail: {state:'" + state + "', code: '" + (code ?? "") + "'}}))"
                self.webView.evaluateJavaScript(script) { value, error in
                    return
                }
            }
            session!.prefersEphemeralWebBrowserSession = true
            session!.presentationContextProvider = self
            session!.start()
        }
        if (type == "open-link") {
            guard let urlString = body.value(forKey: "url") as? String else { return }
            guard let url = URL(string: urlString) else { return }

            safariViewController = SFSafariViewController(url: url)
            safariViewController!.delegate = self
            present(safariViewController!, animated: true, completion: nil)
        }
    }

    func safariViewControllerDidFinish(_ controller: SFSafariViewController) {
        print()
        controller.dismiss(animated: true, completion: nil)
        safariViewController = nil
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        return view.window!
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        // 1
        loadUrl()

        // 2
        let refresh = UIBarButtonItem(barButtonSystemItem: .refresh, target: webView, action: #selector(webView.reload))
        toolbarItems = [refresh]
        webView.navigationDelegate = self

    }

    private func loadUrl() {
        let url = URL(string: mobileBaseUrl)!
        webView.load(URLRequest(url: url))
    }

    override func loadView() {
        let contentController = WKUserContentController()
        contentController.add(self, name: "callback")

        let config = WKWebViewConfiguration()
        config.userContentController = contentController

        webView = WKWebView(frame: self.accessibilityFrame, configuration: config)
        webView.navigationDelegate = self

        let customUserAgent = webView.value(forKey: "userAgent") as! String + " BoostNote-Mobile-iOS"
        webView.customUserAgent = customUserAgent

        webView.allowsLinkPreview = false

        view = webView
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        title = webView.title
        }

    // Handling error
    func webView(_ webView: WKWebView,
    didFailProvisionalNavigation navigation: WKNavigation!,
                withError error: Error) {
        let error = error as NSError
        let alert = UIAlertController(title: "Error \(error.code)", message: "Choose OK to refresh", preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: NSLocalizedString("OK", comment: "Default action"), style: .default, handler: { _ in

            if webView.url != nil {
                webView.reload()
            } else {
                self.loadUrl()
            }
        }))

        self.present(alert, animated: true, completion: nil)
    }
}

