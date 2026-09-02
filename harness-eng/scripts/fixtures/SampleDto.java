package fixtures;

import javax.validation.constraints.NotBlank;

/** fixture for fill-dto-fields */
public class SampleDto {
    @NotBlank
    private String name;
    private Integer page;
    public String getName() { return name; }
}
