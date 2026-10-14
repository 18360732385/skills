package com.x.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ColdController {
  @GetMapping("/api/cold")
  public String cold() {
    return "ok";
  }
}
