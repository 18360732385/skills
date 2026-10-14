package com.x.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DemoController {
  @GetMapping("/api/renamed")
  public String demo() {
    return "ok";
  }
}
